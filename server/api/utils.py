# NOTE Potentially a future basis for ranking content blocks
def increment_rank(rank: str, increment: int = 1) -> str:
    """ Increment base 26 encoded rank id """
    if (val := ord(rank[-1]) + increment) > 122:
        # Value has overflown into character to left
        if rank[-2] != 'z':
            new_rank: str = rank[:-2] + chr(ord(rank[-2]) + 1) + chr(val - 26)
        else:
            # 2nd last char is a z, need to incrememt through
            new_rank: str = rank[:-1] + chr(val - 26)

            i = -2
            while ord(new_rank[i]) >= 122:
                if -i == len(new_rank):
                    new_rank = 'a' + new_rank
                new_rank = new_rank[:i] + 'a' + new_rank[i + 1:]
                i -= 1

        return new_rank
    else:
        return rank[:-1] + chr(val)
