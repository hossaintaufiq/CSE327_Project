package com.example.clientapp.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

data class Sale(val client: String, val amount: String, val date: String)

val sampleSales = listOf(
    Sale("ABtech", "$1200", "2025-11-12"),
    Sale("PQtech", "$980", "2025-11-11"),
    Sale("XYtech", "$450", "2025-11-10")
)

@Composable
fun SalesScreen() {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text(text = "Sales", style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(16.dp))

        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(sampleSales) { sale ->
                Card(modifier = Modifier.fillMaxWidth()) {
                    Row(modifier = Modifier.padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text(sale.client)
                        Text(sale.amount)
                        Text(sale.date)
                    }
                }
            }
        }
    }
}

