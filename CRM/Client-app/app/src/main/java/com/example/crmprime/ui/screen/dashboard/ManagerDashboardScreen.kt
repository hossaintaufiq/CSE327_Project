package com.example.crmprime.ui.screen.dashboard

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.crmprime.data.model.DashboardStats
import com.example.crmprime.ui.components.ActivityCard
import com.example.crmprime.ui.components.StatCard
import com.example.crmprime.util.formatCurrency

@Composable
fun ManagerDashboardScreen(
    stats: DashboardStats?,
    userName: String
) {
    val statsData = stats?.stats
    
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Column(modifier = Modifier.fillMaxWidth()) {
                Text(
                    text = "Manager Dashboard",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Welcome back, $userName",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                StatCard(
                    title = "Team Size",
                    value = "${statsData?.teamSize ?: 0}",
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = "Team Leads",
                    value = "${statsData?.teamLeads ?: 0}",
                    subtitle = "My leads: ${statsData?.myLeads ?: 0}",
                    modifier = Modifier.weight(1f)
                )
            }
        }
        
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                StatCard(
                    title = "Team Orders",
                    value = "${statsData?.teamOrders ?: 0}",
                    subtitle = "My orders: ${statsData?.myOrders ?: 0}",
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = "Team Revenue",
                    value = formatCurrency(statsData?.teamRevenue ?: 0.0),
                    modifier = Modifier.weight(1f)
                )
            }
        }
        
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Text(
                        text = "My Tasks",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier.padding(bottom = 12.dp)
                    )
                    
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(
                                text = "Total Tasks",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = "${statsData?.myTasks ?: 0}",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        
                        Column {
                            Text(
                                text = "Active Tasks",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = "${statsData?.myActiveTasks ?: 0}",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                        
                        Column {
                            Text(
                                text = "Unread Messages",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = "${statsData?.unreadMessages ?: 0}",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
        
        item {
            Text(
                text = "Team Activity",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        }
        
        if (stats?.recentActivity?.isEmpty() == true) {
            item {
                Card(modifier = Modifier.fillMaxWidth()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(32.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "No recent activities",
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        } else {
            items(stats?.recentActivity ?: emptyList()) { activity ->
                ActivityCard(activity = activity)
            }
        }
    }
}


