package com.example.crmprime.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.crmprime.data.model.SuperAdminStats
import com.example.crmprime.data.repository.SuperAdminRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class SuperAdminState(
    val isLoading: Boolean = false,
    val stats: SuperAdminStats? = null,
    val error: String? = null
)

class SuperAdminViewModel : ViewModel() {
    private val repository = SuperAdminRepository()
    
    private val _superAdminState = MutableStateFlow(SuperAdminState())
    val superAdminState: StateFlow<SuperAdminState> = _superAdminState.asStateFlow()
    
    fun loadSuperAdminStats() {
        viewModelScope.launch {
            _superAdminState.value = _superAdminState.value.copy(isLoading = true, error = null)
            val result = repository.getSuperAdminStats()
            if (result.isSuccess) {
                val stats = result.getOrNull()!!
                _superAdminState.value = SuperAdminState(
                    isLoading = false,
                    stats = stats
                )
            } else {
                val error = result.exceptionOrNull()
                _superAdminState.value = _superAdminState.value.copy(
                    isLoading = false,
                    error = error?.message ?: "Failed to load super admin dashboard"
                )
            }
        }
    }
    
    fun refresh() {
        loadSuperAdminStats()
    }
}

