package com.example.clientapp.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.text.font.FontWeight

data class Task(val title: String, val description: String, var completed: Boolean)

val sampleTasks = listOf(
    Task("Follow up with AB", "Call client regarding invoice", false),
    Task("Prepare report", "Sales report for last month", true),
    Task("Team meeting", "Discuss upcoming projects", false)
)

@Composable
fun TasksScreen() {
    var tasks by remember { mutableStateOf(sampleTasks) }

    Column(modifier = Modifier
        .fillMaxSize()
        .padding(16.dp)
    ) {
        Text(text = "Tasks", style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(16.dp))

        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(tasks) { task ->
                Card(modifier = Modifier
                    .fillMaxWidth()
                    .clickable {
                        task.completed = !task.completed
                        tasks = tasks.toList()
                    }
                ) {
                    Row(modifier = Modifier.padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween) {
                        Column {
                            Text(task.title, fontWeight = FontWeight.Bold)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(task.description, style = MaterialTheme.typography.bodyMedium)
                        }
                        Checkbox(
                            checked = task.completed,
                            onCheckedChange = { checked ->
                                task.completed = checked
                                tasks = tasks.toList()
                            }
                        )
                    }
                }
            }
        }
    }
}
