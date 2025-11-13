package com.example.clientapp.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.clientapp.ui.theme.PrimaryColor
import com.example.clientapp.ui.theme.SecondaryColor

data class Lead(
    val id: Int,
    val name: String,
    val company: String,
    val email: String,
    val status: String
)

val mockLeads = listOf(
    Lead(1, "Rahim Khan", "ABtech", "rahim@abtech.com", "New"),
    Lead(2, "Karim Khan", "PQtech", "karim@pqtech.com", "Contacted"),
    Lead(3, "Jamal Khan", "XYtech", "jamal@xytech.com", "Interested"),
    Lead(4, "Kamal Khan", "Umbrella", "kamal@umbrella.com", "Lost")
)

@Composable
fun LeadsScreen() {
    var leads by remember { mutableStateOf(mockLeads) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp)
    ) {
        Text(
            text = "Leads",
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onBackground
        )
        Spacer(modifier = Modifier.height(16.dp))

        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.fillMaxSize()
        ) {
            items(leads) { lead ->
                LeadCard(lead)
            }
        }
    }
}

@Composable
fun LeadCard(lead: Lead) {
    Card(
        shape = RoundedCornerShape(12.dp),
        modifier = Modifier
            .fillMaxWidth()
            .wrapContentHeight(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = lead.name,
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = lead.company,
                    fontSize = 14.sp,
                    color = SecondaryColor
                )
                Text(
                    text = lead.email,
                    fontSize = 14.sp,
                    color = SecondaryColor
                )
            }

            Text(
                text = lead.status,
                color = Color.White,
                fontWeight = FontWeight.Medium,
                modifier = Modifier
                    .background(
                        color = when (lead.status) {
                            "New" -> PrimaryColor
                            "Contacted" -> Color(0xFF4CAF50)
                            "Interested" -> Color(0xFFFFC107)
                            "Lost" -> Color(0xFFF44336)
                            else -> PrimaryColor
                        },
                        shape = RoundedCornerShape(8.dp)
                    )
                    .padding(horizontal = 10.dp, vertical = 6.dp)
            )
        }
    }
}
