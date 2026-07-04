package com.example.server.repository;

import com.example.server.model.Presets;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;

public interface PresetRepository extends MongoRepository<Presets,String> {
    Presets findByPresetName(String name);
    @Query("{ 'presetName' : { $regex: ?0, $options: 'i' } }")
    List<Presets> searchByPresetName(String regex);
}
