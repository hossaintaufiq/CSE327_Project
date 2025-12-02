package com.example.crmprime.data.repository

import com.example.crmprime.data.api.ApiClient
import com.example.crmprime.data.model.DashboardStats
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class DashboardRepository {
    private val apiService = ApiClient.apiService
    
    suspend fun getDashboardStats(): Result<DashboardStats> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getDashboardStats()
            if (response.isSuccessful && response.body()?.success == true) {
                Result.success(response.body()!!.data!!)
            } else {
                Result.failure(Exception(response.body()?.error?.message ?: "Failed to load dashboard"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

