package com.example.crmprime.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.crmprime.data.model.DashboardStats
import com.example.crmprime.data.repository.DashboardRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

data class DashboardState(
    val isLoading: Boolean = false,
    val stats: DashboardStats? = null,
    val error: String? = null
)

class DashboardViewModel : ViewModel() {
    private val repository = DashboardRepository()
    
    private val _dashboardState = MutableStateFlow(DashboardState())
    val dashboardState: StateFlow<DashboardState> = _dashboardState.asStateFlow()
    
    fun loadDashboardStats() {
        viewModelScope.launch {
            _dashboardState.value = _dashboardState.value.copy(isLoading = true, error = null)
            val result = repository.getDashboardStats()
            if (result.isSuccess) {
                val stats = result.getOrNull()!!
                _dashboardState.value = DashboardState(
                    isLoading = false,
                    stats = stats
                )
            } else {
                val error = result.exceptionOrNull()
                _dashboardState.value = _dashboardState.value.copy(
                    isLoading = false,
                    error = error?.message ?: "Failed to load dashboard"
                )
            }
        }
    }
    
    fun refresh() {
        loadDashboardStats()
    }
}

