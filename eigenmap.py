import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import kneighbors_graph
import matplotlib.pyplot as plt

def laplacian_eigenmap(data, k):
    '''Full laplacian eigenmap'''
    
    # step 1: Sstandarlize data set
    scaler = StandardScaler()
    X = scaler.fit(data).transform(data)

    # step 2: Create adjancency matrix and make it symmetric
    adj_directed = kneighbors_graph(X, k, mode='connectivity', include_self=True).toarray()
    W = np.maximum(adj_directed, adj_directed.T)

    # step 3: Calculate Diagnal and Laplacian Matrix
    W_sum = np.sum(W, axis=1)
    D = np.diag(W_sum.T) # need to be array
    L = D - W

    # step 4: calculate the bottom 2 eigenvector with eigenvalue > 0
    eigenvalues, eigenvectors = np.linalg.eigh(L)
    sorted_indices = np.argsort(eigenvalues)
    eigenvectors = eigenvectors[:, sorted_indices]
    bottom_2_eigenvectors = eigenvectors[:,1:3]

    x_axis = bottom_2_eigenvectors[:,0]
    y_axis = bottom_2_eigenvectors[:,1]

    # step 5: Plot graph
    plt.figure(figsize=(12, 9))
    plt.scatter(x_axis, y_axis, color='blue')
    plt.title(f'Scatter Plot of Bottom 2 Eigenvectors With k={k}')
    plt.xlabel('First Bottom Eigenvector')
    plt.ylabel('Second Bottom Eigenvector')
    labels = data.index.to_numpy()
    for i, label in enumerate(labels):
        plt.text(x_axis[i], y_axis[i], label, fontsize=9)
    plt.grid(True)

    return plt