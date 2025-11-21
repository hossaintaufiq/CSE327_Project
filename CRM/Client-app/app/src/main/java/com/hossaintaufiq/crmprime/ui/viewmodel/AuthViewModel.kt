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
                checkAuthState()
            } catch (e: Exception) {
                // Handle initialization errors gracefully
                _uiState.value = _uiState.value.copy(error = "Initialization error: ${e.message}")
            }
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
                    val idToken = firebaseUser.getIdToken(false).await().token
                    
                    if (idToken != null) {
                        authStore.setIdToken(idToken)
                        
                        // Call backend to get user data
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
                    val idToken = firebaseUser.getIdToken(false).await().token
                    
                    if (idToken != null) {
                        authStore.setIdToken(idToken)
                        
                        // Call backend signup endpoint
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

