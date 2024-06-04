import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import kneighbors_graph
import matplotlib.pyplot as plt
from matplotlib.offsetbox import OffsetImage, AnnotationBbox
import os
from PIL import Image
from scipy.spatial import cKDTree

#TODO: maybe make it into a class?

def load_images_from_folders(root_folder, size=(128, 128), mode='RGB'):
    '''
    preprocessing data, read in images and return in the format with dimension (num_images, height, width, channels)
    
    args:
    1. root address
    return:
    1. array with format dimension (num_images, height, width, channels), not flattened data
    '''
    image_data = []
    for subdir, dirs, files in os.walk(root_folder):
        # files = sorted(files)
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                image_path = os.path.join(subdir, file)
                with Image.open(image_path) as img:
                    img = img.convert(mode)  # Convert image to RGB or grayscale
                    img = img.resize(size)  # Resize image to desired size
                    image_data.append(np.array(img))  # Append image array to list
                break  # Exit after the first valid image is processed
    return np.array(image_data)

def load_images(root_folder, size=(128, 128), mode='RGB'):
    '''
    preprocessing data, read in images and return in the format with dimension (num_images, height, width, channels)
    
    args:
    1. root address
    return:
    1. array with format dimension (num_images, height, width, channels), not flattened data
    '''
    image_data = []
    for subdir, dirs, files in os.walk(root_folder):
        # files = sorted(files)
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                image_path = os.path.join(subdir, file)
                with Image.open(image_path) as img:
                    img = img.convert(mode)  # Convert image to RGB or grayscale
                    img = img.resize(size)  # Resize image to desired size
                    image_data.append(np.array(img))  # Append image array to list
    return np.array(image_data)

def laplacian_eigenmap(data, radial_func, k=20, image_dim=128, one_dim=False, num_eigen=1, h=3):
    '''
    Full laplacian eigenmap embedding using:
    1. K-Nearest Neighbor (KNN)
    2. SSIM index similarity matrix
    3. Mutual KNN + Adaptive Gaussian Kernel Function
        - create a k-neignbor connected fully connected graph using k-d tree method, then create a weighted graph using gaussian radial kernel function

    args:
    1. data (array): data with only X
    2. k (int): k nearest neighbor number
    3. image_dim (int): image dimension
    4. color_image (bool): deternmines rather need to have RGB color
    5. color_data (array): additional parameter for passing in RGB color data
    6. radial (string): function used for computing raidal distance, select from ('knn', 'kd_kernel_gaussian', 'ssim')
    7. one_dim (bool): True would return the graph on that eigenvector axis according to the eigenvector number in num_eign
    8. num_eign (int): choose from (0,1), bottom first or second eigenvector
    9. h (int): number of eigenvectors to grab, must be greater or equal to num_eign, default to 3 (grab 2 eigenvector)

    return:
    1. Corresponding eigenvectors
    2. plt.show()
    3. W matrix
    '''
    radial_functions = ['knn', 'kd_kernel_gaussian', 'ssim'] #TODO: Seems to be running slower?
    
    if radial_func not in radial_functions:
        raise ValueError('not implemented function')

    def ssim_index(img1, img2, C1=6.5025, C2=58.5225):
        '''Calculate the ssim_index between 2 images'''

        # Convert images to float64 for precision in calculations
        img1 = img1.astype(np.float64)
        img2 = img2.astype(np.float64)
        
        # Mean of the images
        mean_img1 = np.mean(img1)
        mean_img2 = np.mean(img2)
        
        # Variance and covariance
        var_img1 = np.var(img1)
        var_img2 = np.var(img2)
        cov_img1_img2 = np.cov(img1.ravel(), img2.ravel())[0, 1]
        
        # Calculate SSIM components
        luminance = (2 * mean_img1 * mean_img2 + C1) / (mean_img1**2 + mean_img2**2 + C1)
        contrast = (2 * np.sqrt(var_img1 * var_img2) + C2) / (var_img1 + var_img2 + C2)
        structure = (cov_img1_img2 + C2/2) / (np.sqrt(var_img1) * np.sqrt(var_img2) + C2/2)
        
        return luminance * contrast * structure
    
    def ssim_matrix(data):
        '''Calculate the SSIM index matrix '''
        #TODO: Note very efficient, use sklearn?

        n = len(data)
        ssim_matrix = np.zeros((n, n))
        
        for i in range(n):
            for j in range(i, n):
                # Compute only for i <= j to avoid redundant calculations
                if i == j:
                    ssim_matrix[i, j] = 1.0
                    # The similarity of an image with itself is 1
                else:
                    ssim_value = ssim_index(data[i], data[j])
                    ssim_matrix[i, j] = ssim_value
                    ssim_matrix[j, i] = ssim_value
                    # SSIM is symmetric, fill both [i, j] and [j, i]
        return ssim_matrix

    def mutual_knn_graph(X, k):
        '''mutual knn with adaptive gaussian radial function'''

        def adaptive_gaussian_kernel(distances, sigma):
            return np.exp(-distances**2 / (2 * sigma**2))

        tree = cKDTree(X)
        
        # Get k+1 nearest neighbors because the results include the point itself
        distances, indices = tree.query(X, k=k+1, p=2)  # p=2 for Euclidean distance

        # Exclude the point itself from its list of neighbors
        distances = distances[:, 1:]
        indices = indices[:, 1:]

        # Calculate adaptive sigma: mean distance to the k-th nearest neighbor
        sigma = np.mean(distances[:, -1])
        
        # Create the graph with adaptive Gaussian kernel
        n = X.shape[0]
        graph = np.zeros((n, n))
        for i in range(n):
            for j in range(1, k):
                # Check mutual k-nearest neighbor condition
                if i in indices[indices[j]] and indices[j] in indices[i]:
                    dist_ij = distances[i][j]
                    graph[i, indices[i, j]] = adaptive_gaussian_kernel(dist_ij, sigma)
        
        return graph
    
    # step 1: Standarlize data set
    scaler = StandardScaler()
    X = scaler.fit(data).transform(data)

    # step 2: Select radial functions & create adjancency matrix and make it symmetric
    if radial_func == 'knn':
        adj_directed = kneighbors_graph(X, k, mode='connectivity', include_self=True).toarray()
        W = np.maximum(adj_directed, adj_directed.T)
    if radial_func == 'ssim':
        W = ssim_matrix(X)
    if radial_func =='kd_kernel_gaussian': # must use if statement here, not else, or all computing mutual_knn
        W = mutual_knn_graph(X, k)

    # step 3: Calculate Diagnal and Laplacian Matrix
    W_sum = np.sum(W, axis=1)
    D = np.diag(W_sum.T) # need to be array
    L = D - W

    # step 4: calculate the bottom 2 eigenvector with eigenvalue > 0
    eigenvalues, eigenvectors = np.linalg.eigh(L)
    sorted_indices = np.argsort(eigenvalues)
    eigenvectors = eigenvectors[:, sorted_indices]
    bottom_h_eigenvectors = eigenvectors[:,1:h]

    x_axis = bottom_h_eigenvectors[:,0]
    y_axis = bottom_h_eigenvectors[:,1]

    # step 5: Plot graph
    if not data.shape!=np.array([image_dim, image_dim, 3]):
        # Reshape images
        images = [face.reshape(image_dim, image_dim) for face in data]
        # rngs = np.random.choice(400, random_sample_size)
        # images = [images[rng] for rng in rngs]
    else:
        images = [face.reshape(image_dim, image_dim, 3) for face in data]
    
    if one_dim == False:
        # plot non-image data in 2D
        plt.figure(figsize=(15, 9))
        plt.scatter(x_axis, y_axis, color='blue')
        plt.title(f'Using {radial_func} + Bottom 2 Eigenvectors With k={k} and Sample Size = {X.shape[0]}')
        plt.xlabel('First Bottom Eigenvector')
        plt.ylabel('Second Bottom Eigenvector')
        plt.grid(True)
        plt.show()
        
        # Plot image graph in 2D
        fig, ax = plt.subplots(figsize=(15, 9))

        for (x, y, img) in zip(x_axis, y_axis, images):
            im = OffsetImage(img, zoom=0.35)  # Adjust zoom as necessary
            ab = AnnotationBbox(im, (x, y), frameon=False)
            ax.add_artist(ab)

        plt.title(f'Using {radial_func} + Bottom 2 Eigenvectors With k={k} and Sample Size = {X.shape[0]}')
        ax.set_xlabel('First Bottom Eigenvector')
        ax.set_ylabel('Second Bottom Eigenvector')
        ax.grid(True)

        ax.set_xlim((min(x_axis), max(x_axis)))
        ax.set_ylim((min(y_axis)-0.1, max(y_axis)+0.1))

        plt.show()

        return bottom_h_eigenvectors, W

    else:
        x_axis=bottom_h_eigenvectors[:,num_eigen] # non-optimzie to bottom
        y_range=(-1, 1)
        y_axis = np.random.uniform(y_range[0], y_range[1], len(x_axis))

        # plot non-image data in 1D
        plt.figure(figsize=(15, 9))
        plt.scatter(x_axis, y_axis, color='blue')
        plt.title(f'Using {radial_func} + Bottom 2 Eigenvectors With k={k} and Sample Size = {X.shape[0]}')
        plt.xlabel('First Bottom Eigenvector')
        plt.ylabel('Second Bottom Eigenvector')
        plt.grid(True)
        plt.show()
        
        # Plot image graph in 1D
        fig, ax = plt.subplots(figsize=(15, 9))
        for (x, y, img) in zip(x_axis, y_axis, images):
                    im = OffsetImage(img, zoom=0.35)  # Adjust zoom as necessary
                    ab = AnnotationBbox(im, (x, y), frameon=False)
                    ax.add_artist(ab)

        plt.title(f'Using {radial_func} + Bottom 1 Eigenvectors With k={k} and Sample Size = {X.shape[0]}')
        ax.set_xlabel('First Bottom Eigenvector')
        ax.grid(True)

        ax.set_xlim((min(x_axis), max(x_axis)))
        ax.set_ylim((min(y_axis)-0.1, max(y_axis)+0.1))

        # Show the plot
        plt.show()

        return x_axis, W

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

    plt.title(f'Scatter Plot of Bottom 3 Eigenvectors With k={k} and Sample Size = {data.shape[0]}')
    ax.set_xlabel('First Bottom Eigenvector')
    ax.set_ylabel('Second Bottom Eigenvector')
    ax.set_zlabel('Third Bottom Eigenvector') 
    ax.grid(True)

    return plt


def laplacian_eigenmap_bench_mark(data, k, image_dim=64, color_image=False, color_data=np.nan):
    '''
    for bench_mark purpose of the performance of the laplacien eigenmap function
    '''
    scaler = StandardScaler()
    X = scaler.fit(data).transform(data)

    adj_directed = kneighbors_graph(X, k, mode='connectivity', include_self=True).toarray()
    W = np.maximum(adj_directed, adj_directed.T)

    W_sum = np.sum(W, axis=1)
    D = np.diag(W_sum.T)
    L = D - W

    eigenvalues, eigenvectors = np.linalg.eigh(L)
    sorted_indices = np.argsort(eigenvalues)
    eigenvectors = eigenvectors[:, sorted_indices]
    bottom_2_eigenvectors = eigenvectors[:,1:3]

    x_axis = bottom_2_eigenvectors[:,0]
    y_axis = bottom_2_eigenvectors[:,1]

    plt.figure(figsize=(15, 9))
    plt.scatter(x_axis, y_axis, color='blue')
    plt.title(f'Scatter Plot of Bottom 2 Eigenvectors With k={k} and Sample Size = {X.shape[0]}')
    plt.xlabel('First Bottom Eigenvector')
    plt.ylabel('Second Bottom Eigenvector')
    plt.grid(True)
    plt.close()

    if not color_image:
        images = [face.reshape(image_dim, image_dim) for face in data]
    else:
        images = [face.reshape(image_dim, image_dim, 3) for face in color_data]

    fig, ax = plt.subplots(figsize=(15, 9))

    for (x, y, img) in zip(x_axis, y_axis, images):
        im = OffsetImage(img, zoom=0.35)
        ab = AnnotationBbox(im, (x, y), frameon=False)
        ax.add_artist(ab)

    plt.title(f'Scatter Plot of Bottom 2 Eigenvectors With k={k} and Sample Size = {X.shape[0]}')
    ax.set_xlabel('First Bottom Eigenvector')
    ax.set_ylabel('Second Bottom Eigenvector')
    ax.grid(True)

    ax.set_xlim((min(x_axis), max(x_axis)))
    ax.set_ylim((min(y_axis), max(y_axis)))

    plt.close()


def pca(X, k):
    '''
    Full prinipal component analysis
    
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