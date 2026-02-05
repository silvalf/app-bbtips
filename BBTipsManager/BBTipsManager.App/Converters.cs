using System.Globalization;
using BBTipsManager.Core.Enums;
using Microsoft.Maui.Graphics;

namespace BBTipsManager.App;

public enum AlertSeverity
{
    None,
    Success,
    Error,
    Warning,
    Info
}

public static class Converters
{
    public static InverseBoolConverter InverseBoolConverter { get; } = new();
    public static LucroPrejuizoColorConverter LucroPrejuizoColorConverter { get; } = new();
    public static StatusColorConverter StatusColorConverter { get; } = new();
    public static IsPendenteConverter IsPendenteConverter { get; } = new();
    public static SeverityToColorConverter SeverityToColorConverter { get; } = new();
    public static SeverityToIconConverter SeverityToIconConverter { get; } = new();
    public static BoolToAccentColorConverter BoolToAccentColorConverter { get; } = new();
    public static NullToTextConverter NullToTextConverter { get; } = new();
}

public class SeverityToColorConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is AlertSeverity severity)
        {
            return severity switch
            {
                AlertSeverity.Success => Color.FromArgb("#4CAF50"),  // Verde
                AlertSeverity.Error => Color.FromArgb("#F44336"),    // Vermelho
                AlertSeverity.Warning => Color.FromArgb("#FF9800"), // Laranja
                AlertSeverity.Info => Color.FromArgb("#2196F3"),     // Azul
                _ => Colors.Transparent
            };
        }
        return Colors.Transparent;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

public class SeverityToIconConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is AlertSeverity severity)
        {
            return severity switch
            {
                AlertSeverity.Success => "✓",  // Check circle
                AlertSeverity.Error => "✕",   // Error/X
                AlertSeverity.Warning => "⚠",  // Warning triangle
                AlertSeverity.Info => "ℹ",      // Info circle
                _ => ""
            };
        }
        return "";
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

public class InverseBoolConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is bool boolValue)
            return !boolValue;
        return false;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

public class BoolToAccentColorConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is bool isTrue && isTrue)
        {
            return Color.FromArgb("#2196F3"); // Accent color (Blue)
        }
        return Colors.Transparent;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

public class NullToTextConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        // parameter deve ser "textoParaNulo|textoParaNaoNulo"
        if (value == null && parameter != null)
        {
            var parts = parameter.ToString()?.Split('|');
            return parts?.Length > 0 ? parts[0] : "";
        }
        else if (value != null && parameter != null)
        {
            var parts = parameter.ToString()?.Split('|');
            return parts?.Length > 1 ? parts[1] : "";
        }
        return "";
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

public class LucroPrejuizoColorConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is decimal decimalValue)
        {
            return decimalValue >= 0 
                ? Color.FromArgb("#00d26a")  // Success
                : Color.FromArgb("#ff4757"); // Danger
        }
        return Colors.White;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

public class StatusColorConverter : IMultiValueConverter
{
    public object Convert(object[] values, Type targetType, object parameter, CultureInfo culture)
    {
        if (values.Length > 0 && values[0] is StatusBanca status)
        {
            return status switch
            {
                StatusBanca.Ativa => Color.FromArgb("#00d26a"),
                StatusBanca.Pausada => Color.FromArgb("#ffc107"),
                StatusBanca.StopLoss => Color.FromArgb("#ff4757"),
                StatusBanca.Meta => Color.FromArgb("#00bcd4"),
                _ => Color.FromArgb("#666666")
            };
        }
        return Color.FromArgb("#666666");
    }

    public object[] ConvertBack(object value, Type[] targetTypes, object parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}

public class IsPendenteConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is StatusOperacao status)
            return status == StatusOperacao.Pendente;
        return false;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}
