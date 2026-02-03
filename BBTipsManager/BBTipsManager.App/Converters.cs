using System.Globalization;
using BBTipsManager.Core.Enums;

namespace BBTipsManager.App;

public static class Converters
{
    public static InverseBoolConverter InverseBoolConverter { get; } = new();
    public static LucroPrejuizoColorConverter LucroPrejuizoColorConverter { get; } = new();
    public static StatusColorConverter StatusColorConverter { get; } = new();
    public static IsPendenteConverter IsPendenteConverter { get; } = new();
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
