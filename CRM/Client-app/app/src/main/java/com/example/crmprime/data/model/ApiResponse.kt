package com.example.crmprime.data.model

import com.google.gson.annotations.SerializedName

data class ApiResponse<T>(
    @SerializedName("success")
    val success: Boolean,
    @SerializedName("data")
    val data: T? = null,
    @SerializedName("message")
    val message: String? = null,
    @SerializedName("error")
    val error: ApiError? = null
)

data class ApiError(
    @SerializedName("code")
    val code: String? = null,
    @SerializedName("message")
    val message: String? = null
)

data class LoginRequest(
    @SerializedName("idToken")
    val idToken: String
)

data class LoginResponse(
    @SerializedName("user")
    val user: User
)

