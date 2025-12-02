package com.example.crmprime.data.model

import com.google.gson.annotations.SerializedName

data class CompanyMembership(
    @SerializedName("companyId")
    val companyId: String,
    @SerializedName("role")
    val role: String,
    @SerializedName("joinedAt")
    val joinedAt: String? = null,
    @SerializedName("isActive")
    val isActive: Boolean = true
)

data class User(
    @SerializedName("_id")
    val id: String,
    @SerializedName("firebaseUid")
    val firebaseUid: String,
    @SerializedName("email")
    val email: String,
    @SerializedName("name")
    val name: String? = null,
    @SerializedName("phone")
    val phone: String? = null,
    @SerializedName("avatar")
    val avatar: String? = null,
    @SerializedName("globalRole")
    val globalRole: String = "user",
    @SerializedName("companies")
    val companies: List<CompanyMembership> = emptyList(),
    @SerializedName("isActive")
    val isActive: Boolean = true
)

