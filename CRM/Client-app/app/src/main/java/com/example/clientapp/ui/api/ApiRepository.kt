package com.example.clientapp.ui.api

import retrofit2.await

class ApiRepository {
    private val apiService = ApiClient.retrofit.create(ApiService::class.java)

    suspend fun getLeads(): List<Lead> {
        return try {
            apiService.getLeads().await()
        } catch (e: Exception) {
            emptyList()
        }
    }
}
