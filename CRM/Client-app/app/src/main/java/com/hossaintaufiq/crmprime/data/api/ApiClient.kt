package com.crm.clientapp.data.api

import com.crm.clientapp.BuildConfig
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {
    private var idToken: String? = null
    private var companyId: String? = null
    
    fun setAuthToken(token: String?) {
        idToken = token
    }
    
    fun setCompanyId(companyId: String?) {
        this.companyId = companyId
    }
    
    private val authInterceptor = Interceptor { chain ->
        val original = chain.request()
        val builder = original.newBuilder()
        
        // Add Authorization header
        idToken?.let {
            builder.header("Authorization", "Bearer $it")
        }
        
        // Add Company ID header (similar to X-Company-Id in web client)
        companyId?.let {
            builder.header("X-Company-Id", it)
        }
        
        builder.header("Content-Type", "application/json")
        
        chain.proceed(builder.build())
    }
    
    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }
    
    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .addInterceptor(loggingInterceptor)
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()
    
    private val retrofit = Retrofit.Builder()
        .baseUrl(BuildConfig.API_BASE_URL)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
    
    val apiService: ApiService = retrofit.create(ApiService::class.java)
}

