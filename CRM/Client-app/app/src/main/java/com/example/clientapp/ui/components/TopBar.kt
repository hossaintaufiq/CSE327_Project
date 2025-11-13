package com.example.clientapp.ui.components

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TopBar(title: String, onMenuClick: () -> Unit) {
    SmallTopAppBar(
        title = { Text(text = title, fontSize = 20.sp, fontWeight = FontWeight.Bold) },
        navigationIcon = {
            IconButton(onClick = { onMenuClick() }) {
                Icon(
                    imageVector = Icons.Default.Menu,
                    contentDescription = "Menu"
                )
            }
        },
        modifier = Modifier,
        scrollBehavior = null
    )
}
