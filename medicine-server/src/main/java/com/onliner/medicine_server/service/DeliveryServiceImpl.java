package com.onliner.medicine_server.service;

import com.onliner.medicine_server.entity.Driver;
import com.onliner.medicine_server.entity.PdfAssignment;
import com.onliner.medicine_server.repository.DriverRepository;
import com.onliner.medicine_server.repository.PdfAssignmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class DeliveryServiceImpl implements DeliveryService {

    private final DriverRepository driverRepository;
    private final PdfAssignmentRepository assignmentRepository;

    @Autowired
    public DeliveryServiceImpl(DriverRepository driverRepository,
                               PdfAssignmentRepository assignmentRepository) {
        this.driverRepository = driverRepository;
        this.assignmentRepository = assignmentRepository;
    }

    @Override
    public List<Driver> getAllDrivers() {
        return driverRepository.findAll();
    }

    @Override
    public void assignPdfToDriver(String driverId, String pdfKey) {
        Driver driver = driverRepository.findById(driverId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 driverId: " + driverId));
/*
        if (assignmentRepository.existsByPdfKey(pdfKey)) {
            throw new IllegalStateException("이미 할당된 pdfKey: " + pdfKey);
        }
*/

        PdfAssignment pa = new PdfAssignment(driver.getId(), pdfKey);
        assignmentRepository.save(pa);
    }

    @Override
    public List<PdfAssignment> getAssignmentsByDriver(String driverId) {
        return assignmentRepository.findAllByDriverId(driverId);
    }
}
