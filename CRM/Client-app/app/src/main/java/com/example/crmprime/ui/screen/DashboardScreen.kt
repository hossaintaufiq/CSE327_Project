package com.example.crmprime.ui.screen

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.crmprime.data.model.User
import com.example.crmprime.ui.screen.dashboard.*
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
    val role = if (isSuperAdmin) "super_admin" else (dashboardState.stats?.role ?: companyRole ?: "employee")
    val userName = user.name ?: user.email
    
    LaunchedEffect(Unit) {
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
                .padding(paddingValues)
        ) {
            when {
                isSuperAdmin -> {
                    when {
                        superAdminState.isLoading -> {
                            CircularProgressIndicator(
                                modifier = Modifier.align(Alignment.Center)
                            )
                        }
                        superAdminState.error != null -> {
                            Column(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(16.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.Center
                            ) {
                                Text(
                                    text = superAdminState.error!!,
                                    color = MaterialTheme.colorScheme.error
                                )
                                Spacer(modifier = Modifier.height(16.dp))
                                Button(onClick = { superAdminViewModel.refresh() }) {
                                    Text("Retry")
                                }
                            }
                        }
                        else -> {
                            SuperAdminDashboardScreen(
                                stats = superAdminState.stats,
                                userName = userName
                            )
                        }
                    }
                }
                dashboardState.isLoading -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                dashboardState.error != null -> {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {
                        Text(
                            text = dashboardState.error!!,
                            color = MaterialTheme.colorScheme.error
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = { viewModel.refresh() }) {
                            Text("Retry")
                        }
                    }
                }
                else -> {
                    when (role) {
                        "employee" -> {
                            EmployeeDashboardScreen(
                                stats = dashboardState.stats,
                                userName = userName
                            )
                        }
                        "manager" -> {
                            ManagerDashboardScreen(
                                stats = dashboardState.stats,
                                userName = userName
                            )
                        }
                        "client" -> {
                            ClientDashboardScreen(
                                stats = dashboardState.stats,
                                userName = userName
                            )
                        }
                        "company_admin" -> {
                            AdminDashboardScreen(
                                stats = dashboardState.stats,
                                userName = userName
                            )
                        }
                        else -> {
                            AdminDashboardScreen(
                                stats = dashboardState.stats,
                                userName = userName
                            )
                        }
                    }
                }
            }
        }
    }
}
