package com.crm.clientapp.data.api

import com.crm.clientapp.data.models.*
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    // Auth endpoints
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): Response<ApiResponse<AuthResponse>>
    
    @POST("auth/signup")
    suspend fun signup(@Body request: SignupRequest): Response<ApiResponse<AuthResponse>>
    
    @GET("auth/me")
    suspend fun getMe(): Response<ApiResponse<User>>
    
    // Company endpoints
    @GET("company")
    suspend fun getCompanies(): Response<ApiResponse<List<Company>>>
    
    @POST("company")
    suspend fun createCompany(@Body company: Map<String, Any>): Response<ApiResponse<Company>>
    
    // Client endpoints
    @GET("clients")
    suspend fun getClients(): Response<ApiResponse<List<Client>>>
    
    @POST("clients")
    suspend fun createClient(@Body client: Client): Response<ApiResponse<Client>>
    
    @GET("clients/{id}")
    suspend fun getClient(@Path("id") id: String): Response<ApiResponse<Client>>
    
    @PUT("clients/{id}")
    suspend fun updateClient(@Path("id") id: String, @Body client: Client): Response<ApiResponse<Client>>
    
    @DELETE("clients/{id}")
    suspend fun deleteClient(@Path("id") id: String): Response<ApiResponse<Unit>>
    
    // Dashboard endpoints
    @GET("dashboard/stats")
    suspend fun getDashboardStats(): Response<ApiResponse<Map<String, Any>>>
}

