#!/usr/bin/env python3

def calculate_application_rate(speed, flow_rate, spray_width):
    """Calculates the application rate in Liters per hectare."""
    if speed <= 0 or spray_width <= 0:
        return float('inf')  # Avoid division by zero and invalid inputs
    area_per_min = speed * spray_width * 60
    return round((flow_rate / area_per_min) * 10000, 2)

def calculate_job_cost(hectares, speed, flow_rate, spray_width):
    """
    Calculates the total cost for a spraying job based on a sliding scale rate
    and a tiered discount for volume.
    """
    # Define the anchor points for the sliding scale: (L/ha, R/ha)
    POINT1 = (40, 200.0)
    POINT2 = (80, 300.0)
    POINT3 = (160, 400.0)
    
    DISCOUNT_THRESHOLD_HA = 100
    DISCOUNT_RATE = 0.15

    actual_app_rate = calculate_application_rate(speed, flow_rate, spray_width)
    cost_per_ha_before_discount = 0.0

    if actual_app_rate <= POINT1[0]:
        # Segment 1: Flat rate for low application
        cost_per_ha_before_discount = POINT1[1]
    elif actual_app_rate <= POINT2[0]:
        # Segment 2: Interpolate between P1 and P2
        slope = (POINT2[1] - POINT1[1]) / (POINT2[0] - POINT1[0])
        cost_per_ha_before_discount = POINT1[1] + (actual_app_rate - POINT1[0]) * slope
    elif actual_app_rate <= POINT3[0]:
        # Segment 3: Interpolate between P2 and P3
        slope = (POINT3[1] - POINT2[1]) / (POINT3[0] - POINT2[0])
        cost_per_ha_before_discount = POINT2[1] + (actual_app_rate - POINT2[0]) * slope
    else:  # actual_app_rate > POINT3[0]
        # Segment 4: Extrapolate from P3 using the last known slope
        slope = (POINT3[1] - POINT2[1]) / (POINT3[0] - POINT2[0])
        cost_per_ha_before_discount = POINT3[1] + (actual_app_rate - POINT3[0]) * slope

    # --- Tiered Hectare Discount Logic ---
    total_charge = 0.0
    discount_amount = 0.0
    total_before_discount = hectares * cost_per_ha_before_discount

    if hectares <= DISCOUNT_THRESHOLD_HA:
        total_charge = total_before_discount
    else:
        cost_of_discounted_portion = (hectares - DISCOUNT_THRESHOLD_HA) * cost_per_ha_before_discount
        discount_amount = cost_of_discounted_portion * DISCOUNT_RATE
        total_charge = total_before_discount - discount_amount

    return (total_charge, actual_app_rate, cost_per_ha_before_discount, 
            total_before_discount, discount_amount)

def main():
    """Main function to run the cost calculator and display a quote."""
    print("--- AgriHover Sliding Scale Job Cost Calculator ---")
    
    try:
        hectares_to_spray = float(input("Enter the total hectares to be sprayed: "))
        speed_ms = float(input("Enter drone speed (m/s): "))
        flow_rate_lpm = float(input("Enter drone flow rate (L/min): "))
        spray_width_m = float(input("Enter drone spray width (m): "))

        if hectares_to_spray < 0 or speed_ms <= 0 or flow_rate_lpm < 0 or spray_width_m <= 0:
            print("\nError: All inputs must be positive numbers, and speed/width must be greater than zero.")
            return

        (total_charge, app_rate, cost_per_ha_before_discount, 
         total_before_discount, discount_amount) = calculate_job_cost(
            hectares_to_spray, speed_ms, flow_rate_lpm, spray_width_m
        )

        # --- Build Tabular Output in a list of strings ---
        output_lines = []
        output_lines.append("+" + "-"*58 + "+")
        output_lines.append("|" + "AGRIHOVER SPRAYING QUOTE".center(58) + "|")
        output_lines.append("+" + "-"*58 + "+")
        output_lines.append(f"| {'Job Details':<57}|")
        output_lines.append(f"|   - Total Area: {hectares_to_spray:.2f} ha".ljust(58) + "|")
        output_lines.append(f"|   - Drone Speed: {speed_ms:.2f} m/s".ljust(58) + "|")
        output_lines.append(f"|   - Flow Rate: {flow_rate_lpm:.2f} L/min".ljust(58) + "|")
        output_lines.append(f"|   - Spray Width: {spray_width_m:.2f} m".ljust(58) + "|")
        if app_rate != float('inf'):
            output_lines.append(f"|   - Application Rate: {app_rate:.2f} L/ha".ljust(58) + "|")
            output_lines.append(f"|   - Standard Rate for Job: R {cost_per_ha_before_discount:,.2f} / ha".ljust(58) + "|")
        output_lines.append("+" + "-"*58 + "+")
        output_lines.append("|" + "COST BREAKDOWN".center(58) + "|")
        output_lines.append("+" + "-"*58 + "+")

        if hectares_to_spray <= 100:
            total_str = f"R {total_charge:,.2f}"
            output_lines.append(f"| {f'{hectares_to_spray:.2f} ha @ R {cost_per_ha_before_discount:,.2f}/ha':<43}" + total_str.rjust(14) + " |")
        else:
            standard_ha = 100.0
            discounted_ha = hectares_to_spray - 100.0
            cost_for_standard_ha = standard_ha * cost_per_ha_before_discount
            
            discounted_rate_per_ha = cost_per_ha_before_discount * (1 - 0.15)
            cost_for_discounted_ha = discounted_ha * discounted_rate_per_ha

            output_lines.append(f"| {f'First {standard_ha:.2f} ha @ R {cost_per_ha_before_discount:,.2f}/ha':<43}" + f"R {cost_for_standard_ha:,.2f}".rjust(14) + " |")
            output_lines.append(f"| {f'Next {discounted_ha:.2f} ha @ R {discounted_rate_per_ha:,.2f}/ha':<43}" + f"R {cost_for_discounted_ha:,.2f}".rjust(14) + " |")

        output_lines.append("+" + "="*58 + "+")
        output_lines.append(f"| {'FINAL AMOUNT DUE':<43}" + f"R {total_charge:,.2f}".rjust(14) + " |")
        output_lines.append("+" + "="*58 + "+")

        quote_output = "\n".join(output_lines)

        # --- Display Quote ---
        print("\n\n")
        print(quote_output)

    except ValueError:
        print("\nError: Please enter valid numbers for all inputs.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    main()