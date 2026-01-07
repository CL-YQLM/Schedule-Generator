#!/usr/bin/env python3
"""
Parse JSON output from the Time Slot Selector HTML app.
Converts the JSON data into a numpy array compatible format.
"""

import json
import numpy as np


def parse_json_to_numpy(json_string):
    """
    Parse JSON output from time slot selector and convert to numpy array.

    Args:
        json_string (str): JSON string from the HTML output

    Returns:
        numpy.ndarray: 2D array of shape (5, 90) with dtype=int
                      Rows = days (M, T, W, R, F)
                      Cols = time slots (7:00-22:00, 10-min intervals)
    """
    # Parse JSON
    data = json.loads(json_string)

    # Extract the 2D array
    grid_data = data['data']

    # Convert to numpy array
    arr = np.array(grid_data, dtype=int)

    # Verify shape
    expected_shape = (5, 90)
    if arr.shape != expected_shape:
        raise ValueError(f"Expected shape {expected_shape}, got {arr.shape}")

    return arr


def load_from_file(filepath):
    """
    Load JSON from a file and convert to numpy array.

    Args:
        filepath (str): Path to JSON file

    Returns:
        numpy.ndarray: 2D array of shape (5, 90) with dtype=int
                      Rows = days (M, T, W, R, F)
                      Cols = time slots (7:00-22:00, 10-min intervals)
    """
    with open(filepath, 'r') as f:
        json_string = f.read()

    return parse_json_to_numpy(json_string)


def parseHardFiltering(json_input):
    """
    Filter JSON to show only hard preferences as binary array.

    Converts:
    - 0 (empty) → 0
    - 1 (soft_preference) → 0
    - 2 (hard_preference) → 1

    Args:
        json_input (str or dict): JSON string or parsed JSON dict

    Returns:
        numpy.ndarray: Binary array of shape (5, 90) with dtype=int
                      1 = hard preference, 0 = everything else
    """
    # Parse JSON if it's a string
    if isinstance(json_input, str):
        data = json.loads(json_input)
    else:
        data = json_input

    # Extract the 2D array
    grid_data = data['data']

    # Convert to numpy array
    arr = np.array(grid_data, dtype=int)

    # Verify shape
    expected_shape = (5, 90)
    if arr.shape != expected_shape:
        raise ValueError(f"Expected shape {expected_shape}, got {arr.shape}")

    # Filter: keep only hard preferences (2 → 1, everything else → 0)
    filtered = (arr == 2).astype(int)

    return filtered


def parseSoftFiltering(json_input):
    """
    Filter JSON to show only soft preferences as binary array.

    Converts:
    - 0 (empty) → 0
    - 1 (soft_preference) → 1
    - 2 (hard_preference) → 0

    Args:
        json_input (str or dict): JSON string or parsed JSON dict

    Returns:
        numpy.ndarray: Binary array of shape (5, 90) with dtype=int
                      1 = soft preference, 0 = everything else
    """
    # Parse JSON if it's a string
    if isinstance(json_input, str):
        data = json.loads(json_input)
    else:
        data = json_input

    # Extract the 2D array
    grid_data = data['data']

    # Convert to numpy array
    arr = np.array(grid_data, dtype=int)

    # Verify shape
    expected_shape = (5, 90)
    if arr.shape != expected_shape:
        raise ValueError(f"Expected shape {expected_shape}, got {arr.shape}")

    # Filter: keep only soft preferences (1 → 1, everything else → 0)
    filtered = (arr == 1).astype(int)

    return filtered


def parseHardFilteringFromFile(filepath):
    """
    Load JSON from file and apply hard preference filtering.

    Args:
        filepath (str): Path to JSON file

    Returns:
        numpy.ndarray: Binary array showing only hard preferences
    """
    with open(filepath, 'r') as f:
        json_string = f.read()

    return parseHardFiltering(json_string)


def parseSoftFilteringFromFile(filepath):
    """
    Load JSON from file and apply soft preference filtering.

    Args:
        filepath (str): Path to JSON file

    Returns:
        numpy.ndarray: Binary array showing only soft preferences
    """
    with open(filepath, 'r') as f:
        json_string = f.read()

    return parseSoftFiltering(json_string)


def print_statistics(arr):
    """
    Print statistics about the time slot selection.

    Args:
        arr (numpy.ndarray): The grid array
    """
    total_cells = arr.size
    empty_count = np.sum(arr == 0)
    soft_preference_count = np.sum(arr == 1)
    hard_preference_count = np.sum(arr == 2)

    print("\n" + "="*50)
    print("TIME SLOT STATISTICS")
    print("="*50)
    print(f"Grid Shape: {arr.shape}")
    print(f"Total Cells: {total_cells}")
    print(f"\nEmpty (0):           {empty_count:4d} ({empty_count/total_cells*100:.1f}%)")
    print(f"Soft Preference (1): {soft_preference_count:4d} ({soft_preference_count/total_cells*100:.1f}%)")
    print(f"Hard Preference (2): {hard_preference_count:4d} ({hard_preference_count/total_cells*100:.1f}%)")
    print("="*50 + "\n")


def visualize_grid(arr):
    """
    Print a simple ASCII visualization of the grid.

    Args:
        arr (numpy.ndarray): The grid array
    """
    symbols = {0: '.', 1: '~', 2: '#'}

    print("\nGRID VISUALIZATION:")
    print("Legend: . = Empty  ~ = Could Do  # = Must Do")
    print("-" * (arr.shape[1] + 2))

    for row in arr:
        print('|' + ''.join(symbols[cell] for cell in row) + '|')

    print("-" * (arr.shape[1] + 2))


def find_time_slots(arr, state):
    """
    Find all time slots with a specific state.

    Args:
        arr (numpy.ndarray): The grid array
        state (int): State to search for (0, 1, or 2)

    Returns:
        list: List of (row, col) tuples
    """
    rows, cols = np.where(arr == state)
    return list(zip(rows, cols))


def get_row_statistics(arr):
    """
    Get statistics for each row (day).

    Args:
        arr (numpy.ndarray): The grid array (5, 90)

    Returns:
        list: List of dictionaries with row statistics
    """
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    stats = []
    for i, row in enumerate(arr):
        stats.append({
            'row': i,
            'day': days[i],
            'day_abbr': ['M', 'T', 'W', 'R', 'F'][i],
            'empty': np.sum(row == 0),
            'soft_preference': np.sum(row == 1),
            'hard_preference': np.sum(row == 2)
        })
    return stats


def get_day_statistics(arr):
    """
    Get statistics for each day (row).
    Alias for get_row_statistics for backward compatibility.

    Args:
        arr (numpy.ndarray): The grid array (5, 90)

    Returns:
        list: List of dictionaries with day statistics
    """
    return get_row_statistics(arr)


def get_time_range(arr, start_hour, end_hour):
    """
    Extract a specific time range from the array.

    Args:
        arr (numpy.ndarray): The grid array (5, 90)
        start_hour (int): Starting hour (e.g., 9)
        end_hour (int): Ending hour (e.g., 17)

    Returns:
        numpy.ndarray: Subset of the array for the time range (5, slots)
    """
    start_slot = (start_hour - 7) * 6  # 7 AM is slot 0, 6 slots per hour
    end_slot = (end_hour - 7) * 6
    return arr[:, start_slot:end_slot]


def get_day_column(arr, day):
    """
    Get all time slots for a specific day.

    Args:
        arr (numpy.ndarray): The grid array (5, 90)
        day (str or int): Day name ('M', 'Monday', etc.) or row index (0-4)

    Returns:
        numpy.ndarray: Row for the specified day
    """
    day_map = {
        'M': 0, 'Monday': 0,
        'T': 1, 'Tuesday': 1,
        'W': 2, 'Wednesday': 2,
        'R': 3, 'Thursday': 3,
        'F': 4, 'Friday': 4
    }

    if isinstance(day, str):
        row_idx = day_map.get(day)
        if row_idx is None:
            raise ValueError(f"Invalid day: {day}")
    else:
        row_idx = day

    return arr[row_idx, :]


def slot_to_time(slot_index):
    """
    Convert slot index to time string.

    Args:
        slot_index (int): Slot index (0-89)

    Returns:
        str: Time string (e.g., "7:00", "9:30")
    """
    total_minutes = 7 * 60 + slot_index * 10  # 7 AM start, 10-min intervals
    hours = total_minutes // 60
    minutes = total_minutes % 60
    return f"{hours}:{minutes:02d}"


def time_to_slot(time_str):
    """
    Convert time string to slot index.

    Args:
        time_str (str): Time string (e.g., "9:30", "14:00")

    Returns:
        int: Slot index (0-89)
    """
    parts = time_str.split(':')
    hours = int(parts[0])
    minutes = int(parts[1])
    total_minutes = hours * 60 + minutes
    start_minutes = 7 * 60
    slot = (total_minutes - start_minutes) // 10
    return slot


# Example usage
if __name__ == "__main__":
    # Generate example data programmatically (5 rows x 90 columns)
    example_data = [[0] * 90 for _ in range(5)]
    # Add some sample data
    # Monday (row 0) 9:00-10:00 (slots 12-17): soft_preference
    for i in range(12, 18):
        example_data[0][i] = 1
    # Wednesday (row 2) 14:00-15:00 (slots 42-47): hard_preference
    for i in range(42, 48):
        example_data[2][i] = 2
    # Friday (row 4) 10:00-11:00 (slots 18-23): soft_preference
    for i in range(18, 24):
        example_data[4][i] = 1

    example_json = json.dumps({
        "data": example_data,
        "shape": [5, 90],
        "description": "2D array compatible with numpy.ndarray - shape (5, 90)",
        "time_info": {
            "start_time": "7:00",
            "end_time": "22:00",
            "interval_minutes": 10,
            "total_slots": 90
        },
        "days": ["M", "T", "W", "R", "F"],
        "states": {
            "0": "empty",
            "1": "soft_preference",
            "2": "hard_preference"
        }
    }, indent=2)

    print("\n" + "="*50)
    print("TIMESLOT SELECTOR - PYTHON PARSER")
    print("="*50)

    # Parse the example JSON
    arr = parse_json_to_numpy(example_json)

    print(f"\nSuccessfully parsed JSON to numpy array!")
    print(f"Array dtype: {arr.dtype}")
    print(f"Array shape: {arr.shape}")

    # Print statistics
    print_statistics(arr)

    # Example: Find all "Hard Preference" slots
    hard_preference_slots = find_time_slots(arr, 2)
    print(f"Hard Preference time slots: {len(hard_preference_slots)} found")
    if hard_preference_slots:
        print(f"First few: {hard_preference_slots[:5]}")

    # Example: Get day statistics
    print("\nPer-day statistics:")
    day_stats = get_day_statistics(arr)
    for stat in day_stats:
        print(f"{stat['day']:10s} ({stat['day_abbr']}): Empty={stat['empty']:2d}, Soft={stat['soft_preference']:2d}, Hard={stat['hard_preference']:2d}")

    # Example: Time conversion
    print("\n" + "="*50)
    print("TIME CONVERSION EXAMPLES")
    print("="*50)
    print(f"Slot 0 = {slot_to_time(0)}")
    print(f"Slot 12 = {slot_to_time(12)} (9:00 AM)")
    print(f"Slot 42 = {slot_to_time(42)} (2:00 PM)")
    print(f"Time '9:30' = Slot {time_to_slot('9:30')}")
    print(f"Time '14:00' = Slot {time_to_slot('14:00')}")

    # Example: Get specific day
    print("\n" + "="*50)
    print("DAY-SPECIFIC QUERIES")
    print("="*50)
    monday = get_day_column(arr, 'Monday')
    print(f"Monday 'soft_preference' count: {np.sum(monday == 1)}")
    print(f"Monday 'hard_preference' count: {np.sum(monday == 2)}")

    # Example: Get time range
    print("\n" + "="*50)
    print("TIME RANGE QUERIES")
    print("="*50)
    business_hours = get_time_range(arr, 9, 17)  # 9 AM to 5 PM
    print(f"Business hours (9-17) shape: {business_hours.shape}")
    print(f"Business hours 'hard_preference' count: {np.sum(business_hours == 2)}")

    # Example: Filtering functions
    print("\n" + "="*50)
    print("FILTERING EXAMPLES")
    print("="*50)

    # Hard preference filtering
    hard_only = parseHardFiltering(example_json)
    print(f"\nHard preference filter:")
    print(f"Shape: {hard_only.shape}")
    print(f"Total hard preferences: {np.sum(hard_only)}")
    print(f"Monday hard preferences: {np.sum(hard_only[0])}")
    print(f"Wednesday hard preferences: {np.sum(hard_only[2])}")

    # Soft preference filtering
    soft_only = parseSoftFiltering(example_json)
    print(f"\nSoft preference filter:")
    print(f"Shape: {soft_only.shape}")
    print(f"Total soft preferences: {np.sum(soft_only)}")
    print(f"Monday soft preferences: {np.sum(soft_only[0])}")
    print(f"Friday soft preferences: {np.sum(soft_only[4])}")

    # Show a sample row
    print(f"\nMonday hard preferences (first 20 slots): {hard_only[0][:20]}")
    print(f"Monday soft preferences (first 20 slots): {soft_only[0][:20]}")

    print("\n" + "="*50)
    print("USAGE EXAMPLES")
    print("="*50)
    print("\n1. Parse from string:")
    print("   arr = parse_json_to_numpy(json_string)")
    print("\n2. Load from file:")
    print("   arr = load_from_file('output.json')")
    print("\n3. Find specific slots:")
    print("   must_do = find_time_slots(arr, 2)")
    print("\n4. Get day statistics:")
    print("   stats = get_day_statistics(arr)")
    print("\n5. Get specific day:")
    print("   monday = get_day_column(arr, 'Monday')")
    print("\n6. Get time range:")
    print("   morning = get_time_range(arr, 7, 12)")
    print("\n7. Time conversions:")
    print("   time_str = slot_to_time(15)")
    print("   slot_idx = time_to_slot('9:30')")
    print("\n8. Filter hard preferences only:")
    print("   hard_only = parseHardFiltering(json_string)")
    print("   hard_only = parseHardFilteringFromFile('output.json')")
    print("\n9. Filter soft preferences only:")
    print("   soft_only = parseSoftFiltering(json_string)")
    print("   soft_only = parseSoftFilteringFromFile('output.json')")
    print("\n" + "="*50 + "\n")


# Additional utility functions for advanced use cases

def save_array_to_file(arr, filepath):
    """
    Save numpy array to a file.

    Args:
        arr (numpy.ndarray): The array to save
        filepath (str): Output file path
    """
    np.save(filepath, arr)
    print(f"Array saved to {filepath}")


def load_array_from_file(filepath):
    """
    Load numpy array from a .npy file.

    Args:
        filepath (str): Path to .npy file

    Returns:
        numpy.ndarray: Loaded array
    """
    return np.load(filepath)


def export_to_csv(arr, filepath):
    """
    Export array to CSV file.

    Args:
        arr (numpy.ndarray): The array to export
        filepath (str): Output CSV file path
    """
    np.savetxt(filepath, arr, delimiter=',', fmt='%d')
    print(f"Array exported to CSV: {filepath}")


def compare_arrays(arr1, arr2):
    """
    Compare two time slot arrays and find differences.

    Args:
        arr1 (numpy.ndarray): First array
        arr2 (numpy.ndarray): Second array

    Returns:
        dict: Comparison statistics
    """
    if arr1.shape != arr2.shape:
        raise ValueError("Arrays must have the same shape")

    differences = arr1 != arr2
    num_differences = np.sum(differences)

    return {
        'num_differences': num_differences,
        'percentage_different': (num_differences / arr1.size) * 100,
        'positions': list(zip(*np.where(differences)))
    }
