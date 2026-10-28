import random

CAPACITY = 5
count = 0

while True:
    print("\n--- Vehicle Rental Service ---")
    print("Capacity:", CAPACITY)
    print("Vehicle Count:", count)

    print("\n1. Produce")
    print("2. Consume")
    print("3. Race Condition")
    print("4. Exit")

    choice = input("Enter choice: ")

    if choice == "1":
        if count < CAPACITY:
            count += 1
            print("Producer added a vehicle.")
            print("Count:", count)
        else:
            print("OVERFLOW! Warehouse is full.")

    elif choice == "2":
        if count > 0:
            count -= 1
            print("Consumer rented a vehicle.")
            print("Count:", count)
        else:
            print("UNDERFLOW! No vehicles available.")

    elif choice == "3":
        if count > 0 and count < CAPACITY:

            old_count = count

            producer_result = old_count + 1
            consumer_result = old_count - 1

            print("\nProducer reads:", old_count)
            print("Producer wants to write:", producer_result)

            print("Consumer reads:", old_count)
            print("Consumer wants to write:", consumer_result)

            result = random.choice([
                ("Producer", producer_result),
                ("Consumer", consumer_result)
            ])

            count = result[1]

            print("\nRACE CONDITION!")
            print(result[0], "writes last.")
            print("Final Count:", count)

        else:
            print("Race condition requires count between 1 and", CAPACITY - 1)

    elif choice == "4":
        break

    else:
        print("Invalid choice")