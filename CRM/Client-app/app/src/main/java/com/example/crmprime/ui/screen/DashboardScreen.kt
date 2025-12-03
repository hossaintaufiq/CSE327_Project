package com.example.crmprime.ui.screen

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.crmprime.data.model.User
import com.example.crmprime.ui.screen.dashboard.AdminDashboardScreen
import com.example.crmprime.ui.screen.dashboard.ClientDashboardScreen
import com.example.crmprime.ui.screen.dashboard.EmployeeDashboardScreen
import com.example.crmprime.ui.screen.dashboard.ManagerDashboardScreen
import com.example.crmprime.ui.screen.dashboard.SuperAdminDashboardScreen
import com.example.crmprime.ui.viewmodel.DashboardViewModel
import com.example.crmprime.ui.viewmodel.SuperAdminViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    user: User,
    companyRole: String?,
    onLogout: () -> Unit,
    viewModel: DashboardViewModel = viewModel(),
    superAdminViewModel: SuperAdminViewModel = viewModel()
) {
    val dashboardState by viewModel.dashboardState.collectAsState()
    val superAdminState by superAdminViewModel.superAdminState.collectAsState()

    val isSuperAdmin = user.globalRole == "super_admin"
    val userName = user.name ?: user.email

    LaunchedEffect(key1 = user.id) {
        if (isSuperAdmin) {
            superAdminViewModel.loadSuperAdminStats()
        } else {
            viewModel.loadDashboardStats()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (isSuperAdmin) "Super Admin Dashboard" else "Dashboard") },
                actions = {
                    TextButton(onClick = onLogout) {
                        Text("Logout")
                    }
                }
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentAlignment = Alignment.Center
        ) {
            if (isSuperAdmin) {
                // Super Admin View
                if (superAdminState.isLoading) {
                    CircularProgressIndicator()
                } else if (superAdminState.error != null) {
                    ErrorState(
                        error = superAdminState.error!!,
                        onRetry = { superAdminViewModel.refresh() }
                    )
                } else {
                    SuperAdminDashboardScreen(
                        stats = superAdminState.stats,
                        userName = userName
                    )
                }
            } else {
                // Regular User View
                if (dashboardState.isLoading) {
                    CircularProgressIndicator()
                } else if (dashboardState.error != null) {
                    ErrorState(
                        error = dashboardState.error!!,
                        onRetry = { viewModel.refresh() }
                    )
                } else {
                    val stats = dashboardState.stats
                    val role = if (stats.role.isNotEmpty()) stats.role else companyRole ?: "employee"
                    when (role) {
                        "employee" -> EmployeeDashboardScreen(stats = stats, userName = userName)
                        "manager" -> ManagerDashboardScreen(stats = stats, userName = userName)
                        "client" -> ClientDashboardScreen(stats = stats, userName = userName)
                        "company_admin" -> AdminDashboardScreen(stats = stats, userName = userName)
                        else -> AdminDashboardScreen(stats = stats, userName = userName)
                    }
                }
            }
        }
    }
}

@Composable
private fun ErrorState(error: String, onRetry: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
        modifier = Modifier.padding(16.dp)
    ) {
        Text(
            text = error,
            color = MaterialTheme.colorScheme.error
        )
        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = onRetry) {
            Text("Retry")
        }
    }
}
