package com.hossaintaufiq.crmprime.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.hossaintaufiq.crmprime.data.api.ApiClient
import com.hossaintaufiq.crmprime.data.models.*
import com.hossaintaufiq.crmprime.data.store.AuthStore
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

data class AuthUiState(
    val isLoading: Boolean = false,
    val user: User? = null,
    val error: String? = null,
    val isAuthenticated: Boolean = false
)

class AuthViewModel(
    private val authStore: AuthStore
) : ViewModel() {
    private val firebaseAuth = FirebaseAuth.getInstance()
    
    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()
    
    init {
        viewModelScope.launch {
            try {
                authStore.loadFromStorage()
            } catch (e: Exception) {
                // Silently handle initialization errors - don't block app startup
                android.util.Log.e("AuthViewModel", "Error loading from storage: ${e.message}")
            }
            checkAuthState()
        }
    }
    
    fun checkAuthState() {
        val currentUser = firebaseAuth.currentUser
        _uiState.value = _uiState.value.copy(
            isAuthenticated = currentUser != null && authStore.user != null,
            user = authStore.user
        )
    }
    
    fun login(email: String, password: String) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            try {
                // Firebase Auth login
                val result = firebaseAuth.signInWithEmailAndPassword(email, password).await()
                val firebaseUser = result.user
                
                if (firebaseUser != null) {
                    // Get ID token
                    val idTokenResult = firebaseUser.getIdToken(false).await()
                    val idToken = idTokenResult.token
                    
                    if (idToken != null) {
                        authStore.setIdToken(idToken)
                        
                        // Call backend to get user data
                        try {
                            val response = ApiClient.apiService.getMe()
                            if (response.isSuccessful && response.body()?.success == true) {
                                val user = response.body()?.data
                                if (user != null) {
                                    authStore.setUser(user)
                                    _uiState.value = _uiState.value.copy(
                                        isLoading = false,
                                        user = user,
                                        isAuthenticated = true,
                                        error = null
                                    )
                                } else {
                                    _uiState.value = _uiState.value.copy(
                                        isLoading = false,
                                        error = "User data not found"
                                    )
                                }
                            } else {
                                _uiState.value = _uiState.value.copy(
                                    isLoading = false,
                                    error = response.body()?.message ?: "Failed to get user data"
                                )
                            }
                        } catch (apiError: Exception) {
                            // If API call fails, still mark as authenticated with Firebase
                            _uiState.value = _uiState.value.copy(
                                isLoading = false,
                                error = "Backend connection failed: ${apiError.message}",
                                isAuthenticated = true // Firebase auth succeeded
                            )
                        }
                    } else {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            error = "Failed to get authentication token"
                        )
                    }
                } else {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = "Authentication failed"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message ?: "Login failed"
                )
            }
        }
    }
    
    fun signup(email: String, password: String, name: String, companyName: String? = null) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            try {
                // Firebase Auth signup
                val result = firebaseAuth.createUserWithEmailAndPassword(email, password).await()
                val firebaseUser = result.user
                
                if (firebaseUser != null) {
                    // Get ID token
                    val idTokenResult = firebaseUser.getIdToken(false).await()
                    val idToken = idTokenResult.token
                    
                    if (idToken != null) {
                        authStore.setIdToken(idToken)
                        
                        // Call backend signup endpoint
                        try {
                            val signupRequest = SignupRequest(email, password, name, companyName)
                            val response = ApiClient.apiService.signup(signupRequest)
                            
                            if (response.isSuccessful && response.body()?.success == true) {
                                val authResponse = response.body()?.data
                                val user = authResponse?.user
                                
                                if (user != null) {
                                    authStore.setUser(user)
                                    _uiState.value = _uiState.value.copy(
                                        isLoading = false,
                                        user = user,
                                        isAuthenticated = true,
                                        error = null
                                    )
                                } else {
                                    _uiState.value = _uiState.value.copy(
                                        isLoading = false,
                                        error = "User data not found"
                                    )
                                }
                            } else {
                                _uiState.value = _uiState.value.copy(
                                    isLoading = false,
                                    error = response.body()?.message ?: "Signup failed"
                                )
                            }
                        } catch (apiError: Exception) {
                            // If API call fails, still mark as authenticated with Firebase
                            _uiState.value = _uiState.value.copy(
                                isLoading = false,
                                error = "Backend connection failed: ${apiError.message}",
                                isAuthenticated = true // Firebase auth succeeded
                            )
                        }
                    } else {
                        _uiState.value = _uiState.value.copy(
                            isLoading = false,
                            error = "Failed to get authentication token"
                        )
                    }
                } else {
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = "Signup failed"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message ?: "Signup failed"
                )
            }
        }
    }
    
    fun logout() {
        viewModelScope.launch {
            firebaseAuth.signOut()
            authStore.logout()
            _uiState.value = AuthUiState()
        }
    }
}

