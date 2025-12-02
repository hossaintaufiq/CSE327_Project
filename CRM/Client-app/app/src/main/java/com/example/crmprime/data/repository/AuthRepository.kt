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
            if (response.isSuccessful && response.body()?.success == true) {
                val loginResponse = response.body()!!.data!!
                ApiClient.setAuthToken(idToken)
                Result.success(loginResponse)
            } else {
                Result.failure(Exception(response.body()?.error?.message ?: "Login failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getMe(): Result<User> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getMe()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.body()?.error?.message ?: "Failed to get user"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getMyCompanies(): Result<List<Company>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getMyCompanies()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!.data ?: emptyList())
            } else {
                Result.failure(Exception(response.body()?.error?.message ?: "Failed to get companies"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

