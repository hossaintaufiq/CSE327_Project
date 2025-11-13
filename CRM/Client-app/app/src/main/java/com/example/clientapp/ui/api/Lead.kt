package com.example.clientapp.ui.api

data class Lead(
    val id: Int,
    val name: String,
    val email: String,
    val status: String,
    val owner: String,
    val created: String
)
