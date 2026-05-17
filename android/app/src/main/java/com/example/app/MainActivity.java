package com.example.app;

import android.os.Bundle;
import android.graphics.Color;
import android.os.Build;
import android.view.View;
import android.view.Window;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int APP_BACKGROUND = Color.rgb(220, 239, 241);

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        tintSystemBars();
    }

    private void tintSystemBars() {
        Window window = getWindow();
        window.setStatusBarColor(APP_BACKGROUND);
        window.setNavigationBarColor(APP_BACKGROUND);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(true);
        }

        int flags = View.SYSTEM_UI_FLAG_LAYOUT_STABLE;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
        }

        window.getDecorView().setSystemUiVisibility(flags);
    }
}
