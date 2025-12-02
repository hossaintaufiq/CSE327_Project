package com.example.crmprime.data.api

import com.example.crmprime.data.model.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    @POST("/api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<ApiResponse<LoginResponse>>
    
    @GET("/api/auth/me")
    suspend fun getMe(): Response<ApiResponse<User>>
    
    @GET("/api/company/my-companies")
    suspend fun getMyCompanies(): Response<ApiResponse<List<Company>>>
    
    @GET("/api/dashboard/stats")
    suspend fun getDashboardStats(): Response<ApiResponse<DashboardStats>>
    
    @GET("/api/super-admin/stats")
    suspend fun getSuperAdminStats(): Response<ApiResponse<SuperAdminStats>>
}

