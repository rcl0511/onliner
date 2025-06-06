package com.onliner.medicine_server.service;

import com.onliner.medicine_server.entity.Driver;
import com.onliner.medicine_server.entity.PdfAssignment;
import java.util.List;

public interface DeliveryService {
    List<Driver> getAllDrivers();
    void assignPdfToDriver(String driverId, String pdfKey);
    List<PdfAssignment> getAssignmentsByDriver(String driverId);
}
