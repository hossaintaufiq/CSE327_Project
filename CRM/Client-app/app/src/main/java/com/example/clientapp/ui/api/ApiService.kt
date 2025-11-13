package com.example.clientapp.ui.api

import retrofit2.Call
import retrofit2.http.GET

interface ApiService {
        @GET("leads")
    fun getLeads(): Call<List<Lead>>
}
