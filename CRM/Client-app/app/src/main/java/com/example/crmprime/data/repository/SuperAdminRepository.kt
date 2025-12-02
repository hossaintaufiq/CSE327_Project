package com.example.crmprime.data.repository

import com.example.crmprime.data.api.ApiClient
import com.example.crmprime.data.model.SuperAdminStats
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class SuperAdminRepository {
    private val apiService = ApiClient.apiService
    
    suspend fun getSuperAdminStats(): Result<SuperAdminStats> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getSuperAdminStats()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.body()?.error?.message ?: "Failed to load super admin stats"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

