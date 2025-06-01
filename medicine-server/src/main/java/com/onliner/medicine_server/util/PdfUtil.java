// src/main/java/com/onliner/medicine_server/util/PdfUtil.java
package com.onliner.medicine_server.util;

import org.apache.pdfbox.multipdf.PDFMergerUtility;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

import java.io.File;
import java.io.IOException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class PdfUtil {

    /**
     * 1) PDF 파일을 읽어 텍스트를 추출하고,
     *    줄 단위로 중복을 제거한 뒤, 합친 문자열을 반환
     */
    public static String parseAndDedupeText(File pdfFile) throws IOException {
        try (PDDocument document = PDDocument.load(pdfFile)) {
            PDFTextStripper stripper = new PDFTextStripper();
            String rawText = stripper.getText(document);

            String[] lines = rawText.split("\\r?\\n");
            Set<String> seen = new LinkedHashSet<>();
            for (String line : lines) {
                String t = line.trim();
                if (t.isEmpty() || seen.contains(t)) continue;
                seen.add(t);
            }
            // LinkedHashSet 은 입력 순서대로 유지 → join 시 원본 순서대로 중복 제거
            return String.join("\n", seen);
        }
    }

    /**
     * 2) 중복 제거된 텍스트에서 '병원명'을 정규식으로 추출
     *    (예: '가나다정형외과', '○○병원', '△△클리닉' 등)
     *    없으면 파일명(확장자 제외)을 반환
     */
    public static String extractHospitalName(String parsedText, String originalFilename) {
        // (괄호付き 이름) 뒤에 나오는 순수 병원명 그룹
        Pattern p = Pattern.compile("(?:\\([^)]*\\)\\s*)?([가-힣]+(?:의원|병원|클리닉|정형외과|내과|이비인후과))");
        Matcher m = p.matcher(parsedText);
        if (m.find()) {
            return m.group(1);
        }
        // 못 찾으면 원본 파일명(확장자 제외)으로 대체
        if (originalFilename.toLowerCase().endsWith(".pdf")) {
            return originalFilename.substring(0, originalFilename.length() - 4);
        }
        return originalFilename;
    }

    /**
     * 3) 'YYYY-MM-DD' 또는 'YYYY/MM/DD' 형식을 찾지 못하면
     *    'YY/MM/DD' 형태를 찾아서 '20YYMMDD' 로 변환
     *    둘 다 없으면 현재 타임스탬프를 문자열로 반환
     */
    public static String extractOrderDate(String parsedText) {
        // 4자리 연도 포함 (YYYY-MM-DD 또는 YYYY/MM/DD) → 구분자 제거
        Pattern p1 = Pattern.compile("(\\d{4}[\\-/]\\d{2}[\\-/]\\d{2})");
        Matcher m1 = p1.matcher(parsedText);
        if (m1.find()) {
            return m1.group(1).replaceAll("[\\-/]", "");
        }
        // 2자리 연도(YY/MM/DD) → '20YYMMDD'
        Pattern p2 = Pattern.compile("(\\d{2}/\\d{2}/\\d{2})");
        Matcher m2 = p2.matcher(parsedText);
        if (m2.find()) {
            String[] parts = m2.group(1).split("/");
            return String.format("20%02d%02d%02d",
                    Integer.parseInt(parts[0]),
                    Integer.parseInt(parts[1]),
                    Integer.parseInt(parts[2]));
        }
        // 둘 다 없으면 현재 타임스탬프
        return String.valueOf(System.currentTimeMillis());
    }

    /**
     * 4) 템플릿 PDF와 업로드된 PDF 첫 페이지만 병합해서
     *    outputFilePath 에 저장
     */
    public static void mergeWithTemplate(String templatePath, String contentPath, String outputPath) throws IOException {
        // templatePath: src/main/resources/templates/거래명세서_양식.pdf
        // contentPath:  업로드된 PDF 경로
        // outputPath:   서버상 exports/디렉토리 하위 경로

        try (PDDocument templateDoc = PDDocument.load(new File(templatePath));
             PDDocument contentDoc = PDDocument.load(new File(contentPath));
             PDDocument resultDoc = new PDDocument()) {

            // 1) 템플릿 첫 페이지만 복사
            resultDoc.addPage(templateDoc.getPage(0));

            // 2) 콘텐츠 PDF 첫 페이지 가져오기
            if (contentDoc.getNumberOfPages() > 0) {
                // PDFMergerUtility를 쓰면 전체 문서를 맨 뒤에 붙이므로,
                // 여기서는 ‘첫 페이지만’ 추출하여 임시 문서로 만든 뒤 붙이는 방법을 씁니다
                PDDocument temp = new PDDocument();
                temp.addPage(contentDoc.getPage(0));

                PDFMergerUtility merger = new PDFMergerUtility();
                merger.appendDocument(resultDoc, temp);
                temp.close();
            }

            // 3) 좌표 보정 (원격) 대신 단순히 맨 뒤에 붙였으므로 별도 drawPage 불필요
            //    만약 템플릿 위 특정 위치에 겹쳐 그리려면 PDFBox의 PDPageContentStream을 사용해야 함.

            // 4) 결과 저장
            resultDoc.save(outputPath);
        }
    }
}
