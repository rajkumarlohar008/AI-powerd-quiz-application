package com.example.server.config;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CloudinaryConfig {

    @Value("${config.cloudinary.cloud.name}")
    private String cloudName;

    @Value("${config.cloudinary.cloud.key}")
    private String apiKey;

    @Value("${config.cloudinary.cloud.secret}")
    private String apiSecret;

    @Bean
    public Cloudinary cloudinary() {

        return new Cloudinary(
                ObjectUtils.asMap(
                        "cloud_name", cloudName,
                        "api_key", apiKey,
                        "api_secret", apiSecret,
                        "secure", true
                )
        );
    }

}