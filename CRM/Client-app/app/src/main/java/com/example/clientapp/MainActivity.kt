package com.example.clientapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.example.clientapp.ui.screens.LeadsScreen
import com.example.clientapp.ui.theme.CRMAppTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            CRMAppTheme {
                LeadsScreen()
            }
        }
    }
}
