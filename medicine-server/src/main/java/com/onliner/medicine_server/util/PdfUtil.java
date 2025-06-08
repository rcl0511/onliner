package com.onliner.medicine_server.util;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.PDPageContentStream.AppendMode;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class PdfUtil {

    public static String parseAndDedupeText(File pdfFile) throws IOException {
        try (PDDocument document = PDDocument.load(pdfFile)) {
            PDFTextStripper stripper = new PDFTextStripper();
            String rawText = stripper.getText(document);

            String[] lines = rawText.split("\\r?\\n");
            Set<String> seen = new LinkedHashSet<>();
            for (String line : lines) {
                String t = line.trim();
                if (t.isEmpty() || seen.contains(t))
                    continue;
                seen.add(t);
            }
            return String.join("\n", seen);
        }
    }

    public static String extractHospitalName(String parsedText, String originalFilename) {
        Pattern p = Pattern.compile("(?:\\([^)]*\\)\\s*)?([가-힣]+(?:의원|병원|클리닉|정형외과|내과|이비인후과))");
        Matcher m = p.matcher(parsedText);
        if (m.find())
            return m.group(1);

        if (originalFilename.toLowerCase().endsWith(".pdf")) {
            return originalFilename.substring(0, originalFilename.length() - 4);
        }
        return originalFilename;
    }

    public static String extractOrderDate(String parsedText) {
        Pattern p1 = Pattern.compile("(\\d{4}[\\-/]\\d{2}[\\-/]\\d{2})");
        Matcher m1 = p1.matcher(parsedText);
        if (m1.find())
            return m1.group(1).replaceAll("[\\-/]", "");

        Pattern p2 = Pattern.compile("(\\d{2}/\\d{2}/\\d{2})");
        Matcher m2 = p2.matcher(parsedText);
        if (m2.find()) {
            String[] parts = m2.group(1).split("/");
            return String.format("20%02d%02d%02d",
                    Integer.parseInt(parts[0]),
                    Integer.parseInt(parts[1]),
                    Integer.parseInt(parts[2]));
        }

        return String.valueOf(System.currentTimeMillis());
    }

    public static void overlayTemplate(String templatePath, String contentPath, String outputPath) throws IOException {
        try (PDDocument templateDoc = PDDocument.load(new File(templatePath));
                PDDocument contentDoc = PDDocument.load(new File(contentPath));
                PDDocument outputDoc = new PDDocument()) {

            PDFRenderer templateRenderer = new PDFRenderer(templateDoc);
            PDFRenderer contentRenderer = new PDFRenderer(contentDoc);

            int pageCount = Math.min(templateDoc.getNumberOfPages(), contentDoc.getNumberOfPages());

            for (int i = 0; i < pageCount; i++) {
                BufferedImage templateImage = templateRenderer.renderImageWithDPI(i, 300);
                BufferedImage contentImage = contentRenderer.renderImageWithDPI(i, 300);

                int width = Math.max(templateImage.getWidth(), contentImage.getWidth());
                int height = Math.max(templateImage.getHeight(), contentImage.getHeight());

                BufferedImage combined = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
                combined.getGraphics().drawImage(templateImage, 0, 0, null);
                combined.getGraphics().drawImage(contentImage, 0, 0, null);

                File tempImageFile = File.createTempFile("combined_" + i, ".png");
                ImageIO.write(combined, "png", tempImageFile);

                PDPage outputPage = new PDPage();
                outputDoc.addPage(outputPage);

                PDImageXObject image = PDImageXObject.createFromFileByContent(tempImageFile, outputDoc);

                try (PDPageContentStream contentStream = new PDPageContentStream(outputDoc, outputPage,
                        AppendMode.OVERWRITE, false)) {
                    contentStream.drawImage(image, 0, 0,
                            outputPage.getMediaBox().getWidth(),
                            outputPage.getMediaBox().getHeight());
                }

                tempImageFile.delete();
            }

            outputDoc.save(outputPath);
        }
    }
}
