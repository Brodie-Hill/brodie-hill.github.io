export default class Range
{
    static get empty()
    {
        return new Range(0, 0);
    }
    
    start = 0;
    end = 0;

    constructor(start, end)
    {
        this.start = start || 0;
        this.end = end || 0;
    }
    test(value)
    {
        return value >= this.start && value <= this.end;
    }

    get delta()
    {
        return this.end - this.start;
    }

    get size()
    {
        return Math.abs(this.delta);
    }

    // essentially moves the range to a new value by either setting the start or end, the other being computed to maintain the same delta
    setAnchored({value, anchor})
    {
        const delta = this.delta;
        
        if (anchor == "start")
        {
            this.start = value;
            this.end = value + delta;
        }
        else if (anchor == "end")
        {
            this.end = value;
            this.start = value - delta;
        }
    }
 
    offset(amount)
    {
        // given the amount we return either start or end plus that based on its sign

        return amount < 0 ? this.start + amount : this.end + amount;
    }
    equals(other)
    {
        return this.start == other.start && this.end == other.end;
    }
}