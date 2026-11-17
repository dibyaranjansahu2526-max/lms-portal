package com.lms.controller;

import com.lms.dto.CertificateVerificationDto;
import com.lms.service.CertificateService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CertificateController {

    private final CertificateService certificateService;

    public CertificateController(CertificateService certificateService) {
        this.certificateService = certificateService;
    }

    @GetMapping("/api/certificates/verify/{code}")
    public CertificateVerificationDto verify(@PathVariable String code) {
        return certificateService.verify(code);
    }
}
