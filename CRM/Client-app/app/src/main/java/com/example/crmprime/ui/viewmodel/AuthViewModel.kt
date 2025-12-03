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
            try {
                val result = repository.login(idToken)
                if (result.isSuccess) {
                    val loginResponse = result.getOrNull()
                    if (loginResponse != null) {
                        _authState.value = AuthState(
                            isLoading = false,
                            user = loginResponse.user,
                            isAuthenticated = true
                        )
                    } else {
                        _authState.value = _authState.value.copy(
                            isLoading = false,
                            error = "Login failed: Empty response from server",
                            isAuthenticated = false
                        )
                    }
                } else {
                    throw result.exceptionOrNull() ?: Exception("Login failed: Unknown reason")
                }
            } catch (e: Exception) {
                _authState.value = _authState.value.copy(
                    isLoading = false,
                    error = e.message ?: "An unexpected error occurred during login",
                    isAuthenticated = false
                )
            }
        }
    }

    fun loadUser() {
        viewModelScope.launch {
            _authState.value = _authState.value.copy(isLoading = true, error = null)
            try {
                val result = repository.getMe()
                if (result.isSuccess) {
                    val user = result.getOrNull()
                    if (user != null) {
                        _authState.value = AuthState(
                            isLoading = false,
                            user = user,
                            isAuthenticated = true
                        )
                    } else {
                        _authState.value = _authState.value.copy(
                            isLoading = false,
                            error = "Failed to load user: Empty response from server",
                            isAuthenticated = false
                        )
                    }
                } else {
                    throw result.exceptionOrNull() ?: Exception("Failed to load user: Unknown reason")
                }
            } catch (e: Exception) {
                _authState.value = _authState.value.copy(
                    isLoading = false,
                    error = e.message ?: "An unexpected error occurred while loading user",
                    isAuthenticated = false
                )
            }
        }
    }

    fun logout() {
        _authState.value = AuthState(isAuthenticated = false)
    }

    fun clearError() {
        _authState.value = _authState.value.copy(error = null)
    }
}
