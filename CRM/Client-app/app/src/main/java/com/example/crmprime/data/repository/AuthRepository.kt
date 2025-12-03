package com.example.crmprime.data.repository

import com.example.crmprime.data.api.ApiClient
import com.example.crmprime.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AuthRepository {
    private val apiService = ApiClient.apiService

    suspend fun login(idToken: String): Result<LoginResponse> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.login(LoginRequest(idToken))
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.success == true && body.data != null) {
                    ApiClient.setAuthToken(idToken)
                    Result.success(body.data)
                } else {
                    Result.failure(Exception(body?.error?.message ?: "Login failed: Unknown server error"))
                }
            } else {
                Result.failure(Exception("Login failed: ${response.code()} ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getMe(): Result<User> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getMe()
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.success == true && body.data != null) {
                    Result.success(body.data)
                } else {
                    Result.failure(Exception(body?.error?.message ?: "Failed to get user: Unknown server error"))
                }
            } else {
                Result.failure(Exception("Failed to get user: ${response.code()} ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getMyCompanies(): Result<List<Company>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getMyCompanies()
            if (response.isSuccessful) {
                val body = response.body()
                if (body?.success == true) {
                    Result.success(body.data ?: emptyList())
                } else {
                    Result.failure(Exception(body?.error?.message ?: "Failed to get companies: Unknown server error"))
                }
            } else {
                Result.failure(Exception("Failed to get companies: ${response.code()} ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
