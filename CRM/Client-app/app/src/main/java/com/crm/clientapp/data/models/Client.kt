package com.crm.clientapp.data.models

import com.google.gson.annotations.SerializedName

data class Client(
    @SerializedName("_id") val id: String? = null,
    @SerializedName("name") val name: String,
    @SerializedName("email") val email: String? = null,
    @SerializedName("phone") val phone: String? = null,
    @SerializedName("address") val address: String? = null,
    @SerializedName("company") val company: String? = null,
    @SerializedName("assignedTo") val assignedTo: String? = null,
    @SerializedName("status") val status: String = "lead",
    @SerializedName("notes") val notes: String? = null,
    @SerializedName("companyId") val companyId: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("updatedAt") val updatedAt: String? = null
)

data class ApiResponse<T>(
    @SerializedName("success") val success: Boolean? = null,
    @SerializedName("data") val data: T? = null,
    @SerializedName("message") val message: String? = null,
    @SerializedName("error") val error: String? = null
)

data class LoginRequest(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String
)

data class SignupRequest(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String,
    @SerializedName("name") val name: String,
    @SerializedName("companyName") val companyName: String? = null
)

data class AuthResponse(
    @SerializedName("user") val user: User? = null,
    @SerializedName("token") val token: String? = null,
    @SerializedName("message") val message: String? = null
)

