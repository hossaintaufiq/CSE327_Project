package com.example.clientapp.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

@Composable
fun AnalyticsScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .background(MaterialTheme.colorScheme.background)
    ) {
        Text(text = "Analytics", style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(16.dp))

        AnalyticsCard(title = "Monthly Revenue", value = "$25K", change = "+12%")
        Spacer(modifier = Modifier.height(8.dp))
        AnalyticsCard(title = "New Leads", value = "150", change = "+8%")
        Spacer(modifier = Modifier.height(8.dp))
        AnalyticsCard(title = "Customer Satisfaction", value = "92%", change = "+3%")
    }
}

@Composable
fun AnalyticsCard(title: String, value: String, change: String) {
    Card(
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(text = title, fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f))
                Spacer(modifier = Modifier.height(4.dp))
                Text(text = value, fontSize = 20.sp, fontWeight = FontWeight.Bold)
            }
            Text(
                text = change,
                fontSize = 14.sp,
                color = if (change.startsWith("+")) Color(0xFF4CAF50) else Color(0xFFF44336),
                modifier = Modifier.alignByBaseline()
            )
        }
    }
}

