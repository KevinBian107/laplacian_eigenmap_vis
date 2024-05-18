import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import kneighbors_graph
import matplotlib.pyplot as plt
from matplotlib.offsetbox import OffsetImage, AnnotationBbox


def laplacian_eigenmap(data, k, image_dim=64, random_sample_size=400):
    '''
    Full laplacian eigenmap embedding

    args:
    1. data (data with only X)
    2. k (k nearest neighbor number)

    return:
    1. none
    '''
    
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
    plt.figure(figsize=(15, 9))
    plt.scatter(x_axis, y_axis, color='blue')
    plt.title(f'Scatter Plot of Bottom 2 Eigenvectors With k={k}')
    plt.xlabel('First Bottom Eigenvector')
    plt.ylabel('Second Bottom Eigenvector')
    plt.grid(True)
    plt.show()

    # Reshape images
    images = [face.reshape(image_dim, image_dim) for face in data]
    rngs = np.random.choice(400, random_sample_size)
    images = [images[rng] for rng in rngs]


    # Plot image graph in 2D
    fig, ax = plt.subplots(figsize=(15, 9))

    for (x, y, img) in zip(x_axis, y_axis, images):
        im = OffsetImage(img, zoom=0.35)  # Adjust zoom as necessary
        ab = AnnotationBbox(im, (x, y), frameon=False)
        ax.add_artist(ab)

    plt.title(f'Scatter Plot of Bottom 2 Eigenvectors With k={k}')
    ax.set_xlabel('First Bottom Eigenvector')
    ax.set_ylabel('Second Bottom Eigenvector')
    ax.grid(True)

    ax.set_xlim((min(x_axis), max(x_axis)))
    ax.set_ylim((min(y_axis), max(y_axis)))

    plt.show()


def laplacian_eigenmap_3d(data, k):
    '''3d representation of the lapacian eigenmap graph'''
    
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
    bottom_3_eigenvectors = eigenvectors[:,1:4]

    x_axis = bottom_3_eigenvectors[:,0]
    y_axis = bottom_3_eigenvectors[:,1]
    z_axis = bottom_3_eigenvectors[:,2]

    # step 5: Plot graph in 3D
    plt.figure(figsize=(12, 9))
    ax = plt.subplot(111, projection='3d')  # Set the plot as 3D
    ax.scatter(x_axis, y_axis, z_axis, color='blue')  # 3D scatter plot

    plt.title(f'Scatter Plot of Bottom 3 Eigenvectors With k={k}')
    ax.set_xlabel('First Bottom Eigenvector')
    ax.set_ylabel('Second Bottom Eigenvector')
    ax.set_zlabel('Third Bottom Eigenvector') 
    ax.grid(True)

    return plt


def pca(X, k):
    '''
    Full prinipla component analysis
    
    args:
    1. X (dataset)
    2. k (number of eigenvectors to take)

    return:
    1. top_k_eigenvectors
    '''

    # 1. Mean of all obs (collapse vertically) for each feature dimension (1xd) row vector
    mean_d = np.mean(X, axis=0)
    
    # 2. Center data, don't need to stack to n obsrvation (rows), np can broadcast
    W = X - mean_d

    # 3. Get Covariance Matrix
    C = (1/X.shape[0]) * np.matmul(W.T, W)

    # 4. get top eigen vectors, sort it against eigenvalues, and flip direction
    eigenvalues, eigenvectors = np.linalg.eigh(C)
    sorted_indices = np.argsort(eigenvalues)[::-1]
    eigenvectors = eigenvectors[:, sorted_indices]

    # 5. Get top k eigenvectors
    top_k_eigenvectors = eigenvectors[:,:k]

    # 6. Convert to principal direction axis
    # new_data = np.matmul(W, top_k_eigenvectors)

    # 7. graph the principal component
    plt.figure(figsize=(7, 7))
    for i in range(k):
        example_image = top_k_eigenvectors.T[i]
        plt.subplot(1, k, i + 1)
        plt.imshow(example_image.reshape((64, 64)))
        plt.title(f'Eigenvector {i}')
    
    plt.show()

    return top_k_eigenvectors

def data_match_principal(data, top_k_eigenvector):
    '''
    For visualizing best match images to the top eigenvectors
    
    args:
    1. data
    2. top_k_eigenvector
    
    return:
    1. None
    '''

    value_eigen = {}
    max_match = {}
    min_match = {}
    title=['MAX','MIN']

    for row in range(data.shape[0]):
        for key in range(top_k_eigenvector.shape[1]):
            if key in value_eigen:
                value_eigen[key].append((data[row] @ top_k_eigenvector.T[key], row))
            else:
                value_eigen[key] = []

    for key in value_eigen:
        max_match[key] = max(value_eigen[key])[1]
        min_match[key] = min(value_eigen[key])[1]
        
    for i in range(len(max_match)):
        plt.figure(figsize=(5, 5))
        eigen_match = [max_match[i], min_match[i]]
            
        for j in range(2):
            example_image = data[eigen_match][j]
            plt.subplot(1, 2, j + 1)
            plt.imshow(example_image.reshape((64, 64)))
            plt.title(f'{i+1}th Eigenvector: {title[j]}')
                
        plt.show() 