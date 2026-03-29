
# # import time
# # import random
# # N = 10_000_000
# # data = [random.randint(-1000, 1000) for _ in range(N)]

# # start = time.perf_counter()
# # total_branch = 0
# # for value in data:
# #     if value > 0:
# #         total_branch += value
# # end = time.perf_counter()
# # print(f"Branch-heavy time: {end - start:.4f} seconds")

# # start = time.perf_counter()
# # total_branchfree = 0
# # for value in data:
# #     total_branchfree += max(value, 0)
# # end = time.perf_counter()
# # print(f"Branch-light time: {end - start:.4f} seconds")
# # print(f"Results equal: {total_branch == total_branchfree} seconds")


# import time 
# import random

# N = 50_000_000

# data = [random.randint(1, 100) for _ in range(N)]

# random_indices = [random.randint(0, N-1) for _ in range(N)]

# start = time.perf_counter()
# total_seq = 0
# for i in range(N):
#     total_seq +- data[i]
# end = time.perf_counter()

# print(f"Sequential Access Time:  {end - start:.2f} seconds")


# start = time.perf_counter()
# total_rnd = 0
# for i in range(N):
#     total_rnd += data[random_indices[i]]
# end = time.perf_counter()
# print(f"Random Access Time: {end - start:.2f} seconds")



import time
import random

N = 50_000_000

data = [random.randint(1, 100) for _ in range(N)]

random_indices = [random.randint(0, N-1) for _ in range(N)]

start