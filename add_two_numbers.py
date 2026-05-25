#!/usr/bin/env python3

def add(a, b):
    """Return the sum of two numbers."""
    return a + b


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Add two numbers.")
    parser.add_argument("a", type=float, help="first number")
    parser.add_argument("b", type=float, help="second number")
    args = parser.parse_args()
    result = add(args.a, args.b)
    # print integer without decimal when possible
    if isinstance(result, float) and result.is_integer():
        result = int(result)
    print(result)


if __name__ == "__main__":
    main()
