package com.example.crmprime.data.model

import com.google.gson.annotations.SerializedName

data class Company(
    @SerializedName("_id")
    val id: String,
    @SerializedName("name")
    val name: String,
    @SerializedName("domain")
    val domain: String? = null,
    @SerializedName("adminId")
    val adminId: String,
    @SerializedName("isActive")
    val isActive: Boolean = true
)

