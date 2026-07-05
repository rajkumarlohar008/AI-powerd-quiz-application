package com.example.server.dto;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class DeleteRequest {
    private String id;
    private String email;
}
