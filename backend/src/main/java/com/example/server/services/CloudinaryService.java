package com.example.server.services;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.server.dto.CloudinaryResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public CloudinaryResponse uploadImage(MultipartFile file) throws IOException {

        Map uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.emptyMap()
        );

        return new CloudinaryResponse(
                uploadResult.get("secure_url").toString(),
                uploadResult.get("public_id").toString()
        );
    }

    public void deleteImage(String publicId) throws IOException {

        cloudinary.uploader().destroy(
                publicId,
                ObjectUtils.emptyMap()
        );

    }

}
