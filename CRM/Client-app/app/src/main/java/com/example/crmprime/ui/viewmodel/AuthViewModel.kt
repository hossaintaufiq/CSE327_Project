package com.example.crmprime.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.crmprime.data.model.User
import com.example.crmprime.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class AuthState(
    val isLoading: Boolean = false,
    val user: User? = null,
    val error: String? = null,
    val isAuthenticated: Boolean = false
)

class AuthViewModel : ViewModel() {
    private val repository = AuthRepository()
    
    private val _authState = MutableStateFlow(AuthState())
    val authState: StateFlow<AuthState> = _authState.asStateFlow()
    
    fun login(idToken: String) {
        viewModelScope.launch {
            _authState.value = _authState.value.copy(isLoading = true, error = null)
            val result = repository.login(idToken)
            if (result.isSuccess) {
                val loginResponse = result.getOrNull()!!
                _authState.value = AuthState(
                    isLoading = false,
                    user = loginResponse.user,
                    isAuthenticated = true
                )
            } else {
                val error = result.exceptionOrNull()
                _authState.value = _authState.value.copy(
                    isLoading = false,
                    error = error?.message ?: "Login failed",
                    isAuthenticated = false
                )
            }
        }
    }
    
    fun loadUser() {
        viewModelScope.launch {
            _authState.value = _authState.value.copy(isLoading = true, error = null)
            val result = repository.getMe()
            if (result.isSuccess) {
                val user = result.getOrNull()!!
                _authState.value = AuthState(
                    isLoading = false,
                    user = user,
                    isAuthenticated = true
                )
            } else {
                val error = result.exceptionOrNull()
                _authState.value = _authState.value.copy(
                    isLoading = false,
                    error = error?.message ?: "Failed to load user",
                    isAuthenticated = false
                )
            }
        }
    }
    
    fun logout() {
        _authState.value = AuthState()
    }
    
    fun clearError() {
        _authState.value = _authState.value.copy(error = null)
    }
}

