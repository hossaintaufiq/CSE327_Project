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
    val isLoading: Boolean = true,
    val stats: SuperAdminStats = SuperAdminStats(),
    val error: String? = null
)

class SuperAdminViewModel : ViewModel() {
    private val repository = SuperAdminRepository()

    private val _superAdminState = MutableStateFlow(SuperAdminState())
    val superAdminState: StateFlow<SuperAdminState> = _superAdminState.asStateFlow()

    fun loadSuperAdminStats() {
        viewModelScope.launch {
            _superAdminState.value = SuperAdminState(isLoading = true)
            try {
                val result = repository.getSuperAdminStats()
                if (result.isSuccess) {
                    val stats = result.getOrNull() ?: SuperAdminStats()
                    _superAdminState.value = SuperAdminState(isLoading = false, stats = stats)
                } else {
                    val error = result.exceptionOrNull()
                    _superAdminState.value = SuperAdminState(
                        isLoading = false,
                        error = error?.message ?: "Failed to load super admin dashboard"
                    )
                }
            } catch (e: Exception) {
                _superAdminState.value = SuperAdminState(
                    isLoading = false,
                    error = e.message ?: "An unexpected error occurred"
                )
            }
        }
    }

    fun refresh() {
        loadSuperAdminStats()
    }
}
