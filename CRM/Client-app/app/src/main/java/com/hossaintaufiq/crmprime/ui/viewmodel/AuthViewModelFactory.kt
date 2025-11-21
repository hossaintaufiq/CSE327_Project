package com.hossaintaufiq.crmprime.ui.viewmodel

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.hossaintaufiq.crmprime.data.store.AuthStore

class AuthViewModelFactory(private val context: Context) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(AuthViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return AuthViewModel(AuthStore(context)) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}

