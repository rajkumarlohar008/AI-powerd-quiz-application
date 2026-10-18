package com.example.server.services;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.extractor.ExtractorFactory;
import org.apache.poi.extractor.POITextExtractor;
import org.apache.poi.sl.extractor.SlideShowExtractor;
import org.apache.poi.sl.usermodel.SlideShow;
import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xslf.usermodel.XSLFShape;
import org.apache.poi.xslf.usermodel.XSLFSlide;
import org.apache.poi.xslf.usermodel.XSLFTextShape;
import org.apache.poi.xssf.extractor.XSSFExcelExtractor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;

@Service
public class ExtractTextService {

    private static final Logger log = LoggerFactory.getLogger(ExtractTextService.class);

    public String extractTextFromFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return "";
        }

        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        String contentType = file.getContentType() != null ? file.getContentType().toLowerCase() : "";
        byte[] bytes = file.getBytes();

        log.info("Extracting text from file: '{}' (content-type: '{}', size: {} bytes)", filename, contentType, bytes.length);

        // 1. PDF Document support
        if (contentType.contains("pdf") || filename.endsWith(".pdf")) {
            return extractFromPdf(bytes);
        }

        // 2. Office Document support (Word, PowerPoint, Excel)
        if (isOfficeDocument(filename, contentType)) {
            try {
                String extracted = extractWithPoiFactory(bytes);
                if (extracted != null && !extracted.isBlank()) {
                    return extracted;
                }
            } catch (Throwable e) {
                log.warn("Universal POI extractor failed for '{}': {}. Trying format-specific extractor.", filename, e.getMessage());
            }

            try {
                return extractOfficeFallback(bytes, filename);
            } catch (Exception e) {
                log.error("Specific Office extractor failed for '{}': {}", filename, e.getMessage());
            }
        }

        // 3. Text / Markdown / Code / CSV / JSON / XML / Web formats
        if (isTextOrCode(filename, contentType)) {
            return new String(bytes, StandardCharsets.UTF_8);
        }

        // 4. Universal Fallback: try POI Factory first, then try UTF-8 text if it looks like text
        try {
            String extracted = extractWithPoiFactory(bytes);
            if (extracted != null && !extracted.isBlank()) {
                return extracted;
            }
        } catch (Throwable ignored) {
            // Not an OLE2 or OOXML container
        }

        if (isLikelyText(bytes)) {
            return new String(bytes, StandardCharsets.UTF_8);
        }

        throw new IOException("Unsupported or unreadable file format: " + 
            (!filename.isEmpty() ? filename : contentType));
    }

    private String extractFromPdf(byte[] bytes) throws IOException {
        try (PDDocument document = Loader.loadPDF(bytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }

    private String extractWithPoiFactory(byte[] bytes) throws Exception {
        try (ByteArrayInputStream bais = new ByteArrayInputStream(bytes);
             POITextExtractor extractor = ExtractorFactory.createExtractor(bais)) {
            return extractor.getText();
        }
    }

    private String extractOfficeFallback(byte[] bytes, String filename) throws IOException {
        // Word .docx
        if (filename.endsWith(".docx") || filename.endsWith(".dotx")) {
            try (ByteArrayInputStream bais = new ByteArrayInputStream(bytes);
                 XWPFDocument doc = new XWPFDocument(bais);
                 XWPFWordExtractor extractor = new XWPFWordExtractor(doc)) {
                return extractor.getText();
            }
        }

        // Word .doc (legacy)
        if (filename.endsWith(".doc") || filename.endsWith(".dot")) {
            String text = extractLegacyWordReflective(bytes);
            if (text != null && !text.isBlank()) {
                return text;
            }
        }

        // PowerPoint .pptx
        if (filename.endsWith(".pptx") || filename.endsWith(".ppsx") || filename.endsWith(".potx")) {
            try (ByteArrayInputStream bais = new ByteArrayInputStream(bytes);
                 XMLSlideShow ppt = new XMLSlideShow(bais)) {
                try (SlideShowExtractor<?, ?> extractor = new SlideShowExtractor<>(ppt)) {
                    return extractor.getText();
                } catch (Exception ex) {
                    StringBuilder sb = new StringBuilder();
                    for (XSLFSlide slide : ppt.getSlides()) {
                        for (XSLFShape shape : slide.getShapes()) {
                            if (shape instanceof XSLFTextShape ts) {
                                String t = ts.getText();
                                if (t != null && !t.isBlank()) {
                                    sb.append(t).append("\n");
                                }
                            }
                        }
                    }
                    return sb.toString();
                }
            }
        }

        // PowerPoint .ppt (legacy)
        if (filename.endsWith(".ppt") || filename.endsWith(".pps")) {
            String text = extractLegacyPowerPointReflective(bytes);
            if (text != null && !text.isBlank()) {
                return text;
            }
        }

        // Excel .xlsx
        if (filename.endsWith(".xlsx") || filename.endsWith(".xlsm")) {
            try (ByteArrayInputStream bais = new ByteArrayInputStream(bytes);
                 XSSFWorkbook wb = new XSSFWorkbook(bais);
                 XSSFExcelExtractor extractor = new XSSFExcelExtractor(wb)) {
                return extractor.getText();
            }
        }

        // Excel .xls (legacy)
        if (filename.endsWith(".xls")) {
            String text = extractLegacyExcelReflective(bytes);
            if (text != null && !text.isBlank()) {
                return text;
            }
        }

        // If no specific office format matched or succeeded, try reading as text
        return new String(bytes, StandardCharsets.UTF_8);
    }

    private String extractLegacyWordReflective(byte[] bytes) {
        try {
            Class<?> docClass = Class.forName("org.apache.poi.hwpf.HWPFDocument");
            Class<?> extractorClass = Class.forName("org.apache.poi.hwpf.extractor.WordExtractor");
            Object doc = docClass.getConstructor(InputStream.class).newInstance(new ByteArrayInputStream(bytes));
            Object extractor = extractorClass.getConstructor(docClass).newInstance(doc);
            Method getTextMethod = extractorClass.getMethod("getText");
            String result = (String) getTextMethod.invoke(extractor);
            if (extractor instanceof AutoCloseable ac) ac.close();
            if (doc instanceof AutoCloseable ac) ac.close();
            return result;
        } catch (Throwable t) {
            log.warn("Legacy Word (.doc) reflective extractor unavailable or failed: {}", t.getMessage());
            return null;
        }
    }

    private String extractLegacyPowerPointReflective(byte[] bytes) {
        try {
            Class<?> pptClass = Class.forName("org.apache.poi.hslf.usermodel.HSLFSlideShow");
            Object ppt = pptClass.getConstructor(InputStream.class).newInstance(new ByteArrayInputStream(bytes));
            if (ppt instanceof SlideShow<?, ?> slideShow) {
                try (SlideShowExtractor<?, ?> extractor = new SlideShowExtractor<>(slideShow)) {
                    return extractor.getText();
                }
            }
            return null;
        } catch (Throwable t) {
            log.warn("Legacy PowerPoint (.ppt) reflective extractor unavailable or failed: {}", t.getMessage());
            return null;
        }
    }

    private String extractLegacyExcelReflective(byte[] bytes) {
        try {
            Class<?> wbClass = Class.forName("org.apache.poi.hssf.usermodel.HSSFWorkbook");
            Class<?> extractorClass = Class.forName("org.apache.poi.hssf.extractor.ExcelExtractor");
            Object wb = wbClass.getConstructor(InputStream.class).newInstance(new ByteArrayInputStream(bytes));
            Object extractor = extractorClass.getConstructor(wbClass).newInstance(wb);
            Method getTextMethod = extractorClass.getMethod("getText");
            String result = (String) getTextMethod.invoke(extractor);
            if (extractor instanceof AutoCloseable ac) ac.close();
            if (wb instanceof AutoCloseable ac) ac.close();
            return result;
        } catch (Throwable t) {
            log.warn("Legacy Excel (.xls) reflective extractor unavailable or failed: {}", t.getMessage());
            return null;
        }
    }

    private boolean isOfficeDocument(String filename, String contentType) {
        return filename.endsWith(".docx") || filename.endsWith(".doc")
            || filename.endsWith(".dotx") || filename.endsWith(".dot")
            || filename.endsWith(".pptx") || filename.endsWith(".ppt")
            || filename.endsWith(".ppsx") || filename.endsWith(".pps")
            || filename.endsWith(".potx")
            || filename.endsWith(".xlsx") || filename.endsWith(".xls")
            || filename.endsWith(".xlsm") || filename.endsWith(".xltx")
            || contentType.contains("word")
            || contentType.contains("powerpoint")
            || contentType.contains("presentation")
            || contentType.contains("excel")
            || contentType.contains("spreadsheet")
            || contentType.contains("officedocument")
            || contentType.contains("msword");
    }

    private boolean isTextOrCode(String filename, String contentType) {
        if (contentType.startsWith("text/")) {
            return true;
        }
        return filename.endsWith(".txt") || filename.endsWith(".text")
            || filename.endsWith(".md") || filename.endsWith(".markdown")
            || filename.endsWith(".csv") || filename.endsWith(".tsv")
            || filename.endsWith(".json") || filename.endsWith(".xml")
            || filename.endsWith(".html") || filename.endsWith(".htm")
            || filename.endsWith(".log") || filename.endsWith(".rtf")
            || filename.endsWith(".yaml") || filename.endsWith(".yml")
            || filename.endsWith(".java") || filename.endsWith(".py")
            || filename.endsWith(".js") || filename.endsWith(".jsx")
            || filename.endsWith(".ts") || filename.endsWith(".tsx")
            || filename.endsWith(".c") || filename.endsWith(".cpp")
            || filename.endsWith(".h") || filename.endsWith(".cs")
            || filename.endsWith(".sh") || filename.endsWith(".sql");
    }

    private boolean isLikelyText(byte[] bytes) {
        if (bytes == null || bytes.length == 0) return true;
        int checkLen = Math.min(bytes.length, 1024);
        int nonPrintable = 0;
        for (int i = 0; i < checkLen; i++) {
            byte b = bytes[i];
            if (b == 0) { // null bytes strongly indicate binary files
                return false;
            }
            if ((b < 32 && b != 9 && b != 10 && b != 13) || b == 127) {
                nonPrintable++;
            }
        }
        return nonPrintable < (checkLen * 0.1);
    }
}
